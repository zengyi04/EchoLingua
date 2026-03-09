import os
import random
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage

from datetime import datetime
from srcs.routes import story
from bson import ObjectId
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional

from database import get_database, get_stories_collection

router = APIRouter(prefix="/community", tags=["community"])

# --- SETUP COLLECTIONS ---
db = get_database()
stories = get_stories_collection() 

likes = db["likes"]
comments = db["comments"]
bookmarks = db["bookmarks"]
xp = db["xp"]
notifications = db["notifications"]
chat_sessions = db["chat_sessions"]
language_stats = db["language_stats"]

# --- PYDANTIC MODELS (Data Validation) ---
class StoryUpload(BaseModel):
    createdBy: str  
    title: str
    text: str       
    language: str 
    elderConsent: bool

class ChatMessage(BaseModel):
    userId: str
    scenarioId: str
    message: str

# ==========================================
# 1. STORY INTERACTIONS (Likes, Comments, Bookmarks)
# ==========================================

@router.post("/stories/{story_id}/like")
async def like_story(story_id: str, user_id: str):
    if not ObjectId.is_valid(story_id):
        raise HTTPException(status_code=400, detail="Invalid story id")

    await likes.insert_one({
        "storyId": story_id,
        "userId": user_id,
        "createdAt": datetime.utcnow()
    })
    await stories.update_one(
        {"_id": ObjectId(story_id)},
        {"$inc": {"likes": 1}}
    )
    return {"message": "Story liked"}

@router.post("/stories/{story_id}/comment")
async def comment_story(story_id: str, user_id: str, text: str):
    if not ObjectId.is_valid(story_id):
        raise HTTPException(status_code=400, detail="Invalid story id")

    comment = {
        "storyId": story_id,
        "userId": user_id,
        "text": text,
        "createdAt": datetime.utcnow()
    }
    await comments.insert_one(comment)
    return {"message": "Comment added"}

@router.get("/stories/{story_id}/comments")
async def get_comments(story_id: str):
    cursor = comments.find({"storyId": story_id}).sort("createdAt", -1)
    results = await cursor.to_list(length=100)
    for c in results:
        c["_id"] = str(c["_id"])
    return results

@router.post("/stories/{story_id}/bookmark")
async def bookmark_story(story_id: str, user_id: str):
    await bookmarks.insert_one({
        "storyId": story_id,
        "userId": user_id,
        "createdAt": datetime.utcnow()
    })
    return {"message": "Story bookmarked"}


# ==========================================
# 2. COMMUNITY STORY UPLOAD & MODERATION
# ==========================================

@router.post("/stories/upload")
async def upload_story(story: StoryUpload):
    # Ethical Check
    if not story.elderConsent:
        raise HTTPException(status_code=400, detail="Elder consent is required for cultural stories.")
    
    # Ensure the string is a valid 24-character hex before converting
    if not ObjectId.is_valid(story.createdBy):
        raise HTTPException(status_code=400, detail="Invalid user ID format. Must be a 24-character hex string.")
    
    new_story = {
        "createdBy": ObjectId(story.createdBy), 
        "title": story.title,
        "text": story.text,
        "language": story.language,
        "status": "pending",
        "likes": 0,
        "createdAt": datetime.utcnow()
    }
    result = await stories.insert_one(new_story)
    
    # Notify admins
    await notifications.insert_one({
        "userId": "admin",
        "message": f"New story '{story.title}' needs cultural review.",
        "createdAt": datetime.utcnow()
    })
    
    return {"message": "Story uploaded successfully, pending review.", "storyId": str(result.inserted_id)}

@router.get("/stories/moderation/pending")
async def get_pending_stories():
    cursor = stories.find({"status": "pending"}).sort("createdAt", 1)
    results = await cursor.to_list(length=50)
    for r in results:
        r["_id"] = str(r["_id"])
    return results

@router.put("/stories/moderation/{story_id}/verify")
async def verify_story(story_id: str, status: str): 
    if not ObjectId.is_valid(story_id):
        raise HTTPException(status_code=400, detail="Invalid story id")
        
    await stories.update_one(
        {"_id": ObjectId(story_id)},
        {"$set": {"status": status}}
    )
    
    if status == "approved":
        story = await stories.find_one({"_id": ObjectId(story_id)})
        if story:
            await add_xp(story["userId"], 50) 
        
    return {"message": f"Story marked as {status}"}


# ==========================================
# 3. GAMIFICATION (XP, Levels, Leaderboard, Streaks)
# ==========================================

@router.post("/xp/add")
async def add_xp(user_id: str, amount: int):
    await xp.update_one(
        {"userId": user_id},
        {"$inc": {"xp": amount}},
        upsert=True
    )
    return {"message": "XP added"}

@router.get("/xp/{user_id}")
async def get_level(user_id: str):
    user = await xp.find_one({"userId": user_id})
    if not user:
        return {"level": 0, "xp": 0}

    total_xp = user.get("xp", 0)
    level = total_xp // 100
    return {"xp": total_xp, "level": level}

@router.get("/leaderboard")
async def get_leaderboard():
    cursor = xp.find().sort("xp", -1).limit(10)
    results = await cursor.to_list(length=10)
    for r in results:
        r["_id"] = str(r["_id"])
    return results

@router.post("/gamification/checkin")
async def daily_checkin(user_id: str):
    user_data = await xp.find_one({"userId": user_id})
    now = datetime.utcnow()
    
    if not user_data:
        await xp.insert_one({"userId": user_id, "xp": 10, "streak": 1, "lastLogin": now, "badges": []})
        return {"message": "First login! Streak: 1"}
        
    last_login = user_data.get("lastLogin", now)
    delta_days = (now - last_login).days
    
    new_streak = user_data.get("streak", 0)
    badges = user_data.get("badges", [])
    
    if delta_days == 1:
        new_streak += 1
    elif delta_days > 1:
        new_streak = 1 
        
    if new_streak == 7 and "7_Day_Scholar" not in badges:
        badges.append("7_Day_Scholar")
        await notifications.insert_one({"userId": user_id, "message": "Unlocked Badge: 7 Day Scholar!", "createdAt": now})

    await xp.update_one(
        {"userId": user_id},
        {"$set": {"streak": new_streak, "lastLogin": now, "badges": badges}}
    )
    return {"streak": new_streak, "badges": badges}


# ==========================================
# 4. NOTIFICATIONS & VITALITY DASHBOARD
# ==========================================

@router.post("/notifications")
async def create_notification(user_id: str, message: str):
    await notifications.insert_one({
        "userId": user_id,
        "message": message,
        "createdAt": datetime.utcnow()
    })
    return {"message": "Notification created"}

@router.get("/notifications/{user_id}")
async def get_notifications(user_id: str):
    cursor = notifications.find({"userId": user_id}).sort("createdAt", -1)
    results = await cursor.to_list(length=50)
    for r in results:
        r["_id"] = str(r["_id"])
    return results

@router.get("/vitality/stats")
async def get_vitality_stats():
    total_stories = await stories.count_documents({"status": "approved"})
    active_learners = await xp.count_documents({"streak": {"$gt": 0}})
    
    vitality_score = min(100, (total_stories * 2) + (active_learners * 5))
    
    return {
        "vitalityScore": vitality_score,
        "totalApprovedStories": total_stories,
        "activeLearnersThisWeek": active_learners,
        "topLanguageRevitilization": "Iban", 
        "status": "Growing" if vitality_score > 50 else "Needs Attention"
    }


# ==========================================
# 5. LIVING LANGUAGE MODE ENGINE (Roleplay)
# ==========================================



@router.post("/living-language/chat")
async def living_language_chat(chat_req: ChatMessage):
    session = await chat_sessions.find_one({"userId": chat_req.userId, "scenarioId": chat_req.scenarioId})
    history = session["history"] if session else []
    
    # --- 1. Prepare AI Context ---
    # Give the AI a persona
    langchain_messages = [
        SystemMessage(content="You are a helpful language teacher roleplaying in a scenario to teach an indigenous language. Keep responses short and conversational.")
    ]
    
    # Load past database history into Langchain
    for msg in history:
        if msg["role"] == "user":
            langchain_messages.append(HumanMessage(content=msg["content"]))
        elif msg["role"] == "ai":
            langchain_messages.append(AIMessage(content=msg["content"]))
            
    # Add the current user message
    langchain_messages.append(HumanMessage(content=chat_req.message))
    history.append({"role": "user", "content": chat_req.message})
    
    # --- 2. Call Gemini ---
    api_keys = os.getenv("GEMINI_API_KEY_LIST", "").split(",")
    active_key = random.choice(api_keys) if api_keys[0] else ""
    
    llm = ChatGoogleGenerativeAI(model="gemini-2.5-flash", google_api_key=active_key)
    
    try:
        response = await llm.ainvoke(langchain_messages)
        ai_response = response.content
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Gemini API Error: {str(e)}")
    
    # --- 3. Save and Return ---
    history.append({"role": "ai", "content": ai_response})
    
    await chat_sessions.update_one(
        {"userId": chat_req.userId, "scenarioId": chat_req.scenarioId},
        {"$set": {"history": history, "updatedAt": datetime.utcnow()}},
        upsert=True
    )
    
    return {"ai_reply": ai_response, "scenarioId": chat_req.scenarioId}
