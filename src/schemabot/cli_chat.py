#!/usr/bin/env python3
"""
Simple CLI chat interface for testing the conversational data collection system.
"""

import asyncio
import sys
from datetime import datetime
from pathlib import Path

# Add the src directory to the Python path
sys.path.insert(0, str(Path(__file__).parent))

from core.conversation.langgraph_engine import SimpleLangGraphEngine, ExtractedField, ConversationStage
import aiohttp

async def perform_eligibility_check(farmer_id: str) -> dict:
    """Perform eligibility check using the scheme server endpoint"""
    try:
        async with aiohttp.ClientSession() as session:
            # Call the scheme server eligibility endpoint
            url = f"http://localhost:8002/eligibility/pm-kisan/{farmer_id}"
            
            async with session.post(url) as response:
                if response.status == 200:
                    result = await response.json()
                    return {
                        "success": True,
                        "data": result.get("data", {}),
                        "message": "Eligibility check completed successfully"
                    }
                else:
                    error_text = await response.text()
                    return {
                        "success": False,
                        "message": f"Eligibility check failed with status {response.status}: {error_text}"
                    }
    except Exception as e:
        return {
            "success": False,
            "message": f"Eligibility check error: {str(e)}"
        }

async def main():
    """CLI chat interface for PM-KISAN application"""
    print("🚀 Starting PM-KISAN Application Assistant...")
    
    # Initialize the conversation engine
    engine = SimpleLangGraphEngine()
    
    try:
        # Initialize conversation
        welcome_msg, state = await engine.initialize_conversation("pm-kisan")
        print(f"\n{welcome_msg}")
        
        # Show developer commands
        print("\n🔧 **Developer Commands:**")
        print("  /skip - Skip current question")
        print("  /skipall - Skip all remaining questions in current stage")
        print("  /skipstage - Skip entire current stage")
        print("  /status - Show current progress")
        print("  /preview - Preview EFR data format")
        print("  /help - Show this help")
        print("  /exit - Exit the application")
        print("  /restart - Restart the conversation")
        
        while True:
            try:
                # Get user input
                user_input = input(f"\n[{state.stage.value}] You: ").strip()
                
                # Handle special commands
                if user_input.lower() == "/exit":
                    print("👋 Goodbye! Thank you for using PM-KISAN Assistant.")
                    break
                elif user_input.lower() == "/help":
                    print("\n🔧 **Available Commands:**")
                    print("  /skip - Skip current question")
                    print("  /skipall - Skip all remaining questions in current stage")
                    print("  /skipstage - Skip entire current stage")
                    print("  /status - Show current progress")
                    print("  /help - Show this help")
                    print("  /exit - Exit the application")
                    print("  /restart - Restart the conversation")
                    continue
                elif user_input.lower() == "/status":
                    summary = engine.get_conversation_summary(state)
                    print(f"\n📊 **Current Status:** {summary}")
                    print(f"🔧 **Stage:** {state.stage.value}")
                    print(f"📝 **Collected Data:** {len(state.collected_data)} fields")
                    print(f"🚫 **Exclusions:** {len(state.exclusion_data)} answered")
                    continue
                elif user_input.lower() == "/preview":
                    if state.stage.value in ["summary", "completed"]:
                        preview = engine.get_efr_data_preview(state)
                        print(f"\n📋 **EFR Data Preview:**")
                        import json
                        print(json.dumps(preview, indent=2, default=str))
                    else:
                        print(f"\n⚠️ **Preview not available yet.** Complete the conversation first to see EFR data format.")
                    continue
                elif user_input.lower() == "/restart":
                    print("🔄 Restarting conversation...")
                    # Clear LLM context before restarting
                    await engine._clear_llm_context()
                    welcome_msg, state = await engine.initialize_conversation("pm-kisan")
                    print(f"\n{welcome_msg}")
                    continue
                elif user_input.lower() == "/skipstage":
                    # Skip entire current stage
                    if state.stage.value == "basic_info":
                        # Mark all required fields as collected with dummy data
                        for field in engine.required_fields:
                            if field not in state.collected_data:
                                state.collected_data[field] = ExtractedField(
                                    value="[SKIPPED]",
                                    confidence=1.0,
                                    source="developer_skip",
                                    timestamp=datetime.now(),
                                    raw_input="[SKIPPED]"
                                )
                        state.stage = ConversationStage.FAMILY_MEMBERS
                        state.response = "✅ [DEV] Skipped basic info stage. Moving to family members."
                        # Automatically ask first family question using LLM
                        if engine.family_member_structure:
                            family_question = await engine._ask_family_question_with_llm(state)
                            state.response += f"\n\n{family_question}"
                    elif state.stage.value == "exclusion_criteria":
                        # Mark all exclusions as False
                        for field in engine.exclusion_fields:
                            state.exclusion_data[field] = False
                        state.stage = ConversationStage.SPECIAL_PROVISIONS
                        state.response = "✅ [DEV] Skipped exclusion stage. Moving to special provisions."
                        # Clear user input to trigger LLM-based special provisions flow
                        state.user_input = ""
                        # Let the engine handle the special provisions flow with LLM
                        response, state = await engine.process_user_input("", state)
                        state.response = response
                    elif state.stage.value == "family_members":
                        state.stage = ConversationStage.EXCLUSION_CRITERIA
                        state.response = "✅ [DEV] Skipped family stage. Moving to exclusions."
                        # Automatically ask first exclusion question
                        first_exclusion_question = await engine._get_next_exclusion_question(state)
                        if first_exclusion_question:
                            state.response += f"\n\n{first_exclusion_question}"
                    elif state.stage.value == "special_provisions":
                        # Mark as no special provisions and let engine handle completion
                        state.special_provisions["region_special"] = "none"
                        state.special_provisions["has_special_certificate"] = False
                        state.stage = ConversationStage.SUMMARY
                        state.response = "✅ [DEV] Skipped special provisions. Moving to summary."
                        # Let the engine handle the summary message
                        response, state = await engine.process_user_input("", state)
                        state.response = response
                    elif state.stage.value == "summary":
                        # Skip summary and go directly to completion
                        state.stage = ConversationStage.COMPLETED
                        state.response = "✅ [DEV] Skipped summary. Application complete!"
                        # Let the engine handle the completion message
                        response, state = await engine.process_user_input("", state)
                        state.response = response
                    else:
                        state.response = "❌ Cannot skip completed stage."
                    print(f"\n🤖 Assistant: {state.response}")
                    continue
                
                # Handle empty input - let the engine handle it to ask questions proactively
                if not user_input:
                    # Call the engine with empty input to trigger proactive question asking
                    response, state = await engine.process_user_input("", state)
                    
                    # Display response and progress
                    print(f"\n🤖 Assistant: {response}")
                    
                    # Show progress summary
                    summary = engine.get_conversation_summary(state)
                    print(f"📊 Progress: {summary}")
                    
                    # Show debug info
                    if state.debug_log:
                        latest_debug = state.debug_log[-1]
                        print(f"🔧 Debug: {latest_debug}")
                    
                    continue
                
                # Process user input
                response, state = await engine.process_user_input(user_input, state)
                
                # Display response and progress
                print(f"\n🤖 Assistant: {response}")
                
                # Show progress summary
                summary = engine.get_conversation_summary(state)
                print(f"📊 Progress: {summary}")
                
                # Show debug info
                if state.debug_log:
                    latest_debug = state.debug_log[-1]
                    print(f"🔧 Debug: {latest_debug}")
                
                # If application is complete, handle upload and eligibility check
                if state.stage == ConversationStage.COMPLETED:
                    print("\n🔄 **Processing Complete Application...**")
                    
                    try:
                        # Extract JSON data from the response
                        import json
                        import re
                        
                        # Find JSON data in the response
                        json_match = re.search(r'```json\s*(\{.*?\})\s*```', response, re.DOTALL)
                        if json_match:
                            farmer_data = json.loads(json_match.group(1))
                            
                            print("📤 **Uploading to EFR Database...**")
                            # Upload to EFR database
                            upload_result = await engine.upload_to_efr_database(state)
                            
                            if upload_result.get("success"):
                                farmer_id = upload_result.get("farmer_id")
                                print(f"✅ **EFR Upload Successful!** Farmer ID: {farmer_id}")
                                
                                # Trigger eligibility check using scheme server
                                print("🔍 **Performing Eligibility Check...**")
                                eligibility_result = await perform_eligibility_check(farmer_id)
                                
                                if eligibility_result.get("success"):
                                    print("✅ **Eligibility Check Complete!**")
                                    eligibility_data = eligibility_result.get("data", {})
                                    
                                    print(f"\n📋 **Eligibility Results:**")
                                    print(f"• Eligible: {eligibility_data.get('eligible', 'Unknown')}")
                                    print(f"• Score: {eligibility_data.get('score', 'N/A')}")
                                    print(f"• Reasons: {eligibility_data.get('reasons', [])}")
                                    
                                    if eligibility_data.get('eligible'):
                                        print(f"\n🎉 **Congratulations! You are eligible for PM-KISAN benefits.**")
                                    else:
                                        print(f"\n❌ **Sorry, you are not eligible for PM-KISAN benefits.**")
                                        print(f"Reasons: {', '.join(eligibility_data.get('reasons', []))}")
                                else:
                                    print(f"❌ **Eligibility Check Failed:** {eligibility_result.get('message', 'Unknown error')}")
                            else:
                                print(f"❌ **EFR Upload Failed:** {upload_result.get('message', 'Unknown error')}")
                        else:
                            print("❌ **Could not extract application data from response**")
                            print("📋 **Raw Response:**")
                            print(response)
                            print("\n🔍 **Attempting to extract data from state...**")
                            # Try to get data directly from state
                            try:
                                farmer_data = engine.convert_to_efr_farmer_data(state)
                                print("✅ **Data extracted from state:**")
                                print(json.dumps(farmer_data, indent=2, default=str))
                            except Exception as e:
                                print(f"❌ **State extraction also failed:** {str(e)}")
                            
                    except Exception as e:
                        print(f"❌ **Processing Error:** {str(e)}")
                    
                    print("\n🎉 **Application processing complete!**")
                    break
                
            except KeyboardInterrupt:
                print("\n\n👋 Goodbye! Thank you for using PM-KISAN Assistant.")
                break
            except Exception as e:
                print(f"\n❌ Error: {str(e)}")
                print("Please try again or use /restart to start over.")
    
    except Exception as e:
        print(f"❌ Failed to initialize: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    asyncio.run(main())