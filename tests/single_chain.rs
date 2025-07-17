// Copyright (c) Zefchain Labs, Inc.
// SPDX-License-Identifier: Apache-2.0

//! Integration testing for the flappy application.

#![cfg(not(target_arch = "wasm32"))]

use flappy::{Operation, InstantiationArgument};
use linera_sdk::test::{QueryOutcome, TestValidator};

/// Tests basic practice score submission
///
/// Creates the application on a `chain`, initializing it with a player name then submit a practice score.
#[tokio::test(flavor = "multi_thread")]
async fn single_chain_test() {
    let (validator, module_id) =
        TestValidator::with_current_module::<flappy::FlappyAbi, (), InstantiationArgument>().await;
    let mut chain = validator.new_chain().await;

    let args = InstantiationArgument {
        player_name: "test_player".to_string(),
        admin_username: None,
        admin_hash: None,
    };
    let application_id = chain
        .create_application(module_id, (), args, vec![])
        .await;

    // Submit a practice score
    let score = 100u64;
    chain
        .add_block(|block| {
            block.with_operation(application_id, Operation::SubmitPracticeScore { 
                username: "test_player".to_string(),
                score,
            });
        })
        .await;

    let QueryOutcome { response, .. } =
        chain.graphql_query(application_id, "query { myPracticeBest }").await;
    let best_score = response["myPracticeBest"].as_u64().expect("Failed to get the u64");

    assert_eq!(best_score, score); // Should be 100
}

/// Tests user management functionality
#[tokio::test(flavor = "multi_thread")]
async fn user_management_test() {
    let (validator, module_id) =
        TestValidator::with_current_module::<flappy::FlappyAbi, (), InstantiationArgument>().await;
    let mut chain = validator.new_chain().await;

    let args = InstantiationArgument {
        player_name: "leaderboard".to_string(),
        admin_username: Some("admin".to_string()),
        admin_hash: Some("admin_hash".to_string()),
    };
    let application_id = chain
        .create_application(module_id, (), args, vec![])
        .await;

    // Setup as leaderboard chain
    chain
        .add_block(|block| {
            block.with_operation(
                application_id,
                Operation::SetupGame {
                    leaderboard_chain_id: chain.id(),
                    leaderboard_name: "leaderboard".to_string(),
                },
            );
        })
        .await;

    // Test that admin was created during instantiation
    chain
        .add_block(|block| {
            block.with_operation(
                application_id,
                Operation::LoginOrRegister {
                    username: "admin".to_string(),
                    hash: "admin_hash".to_string(),
                    requester_chain_id: chain.id(),
                },
            );
        })
        .await;

    // Query admin login result
    let QueryOutcome { response, .. } = chain
        .graphql_query(
            application_id,
            &format!("query {{ loginResultFor(chainId: \"{}\") {{ success isNewUser message user {{ username role }} }} }}", chain.id()),
        )
        .await;

    let success = response["loginResultFor"]["success"]
        .as_bool()
        .expect("Failed to get admin login success");
    let is_new_user = response["loginResultFor"]["isNewUser"]
        .as_bool()
        .expect("Failed to get admin isNewUser");
    let role = response["loginResultFor"]["user"]["role"]
        .as_str()
        .expect("Failed to get admin role");

    assert!(success);
    assert!(!is_new_user); // Admin was pre-created during instantiation
    assert_eq!(role, "ADMIN"); // GraphQL enum returns uppercase

    // Test user registration
    chain
        .add_block(|block| {
            block.with_operation(
                application_id,
                Operation::LoginOrRegister {
                    username: "testuser".to_string(),
                    hash: "testhash".to_string(),
                    requester_chain_id: chain.id(),
                },
            );
        })
        .await;

    // Query the login result using the new loginResultFor query
    let QueryOutcome { response, .. } = chain
        .graphql_query(
            application_id,
            &format!("query {{ loginResultFor(chainId: \"{}\") {{ success isNewUser message }} }}", chain.id()),
        )
        .await;

    let success = response["loginResultFor"]["success"]
        .as_bool()
        .expect("Failed to get success");
    let is_new_user = response["loginResultFor"]["isNewUser"]
        .as_bool()
        .expect("Failed to get isNewUser");

    assert!(success);
    assert!(is_new_user);

    // Test login with same user
    chain
        .add_block(|block| {
            block.with_operation(
                application_id,
                Operation::LoginOrRegister {
                    username: "testuser".to_string(),
                    hash: "testhash".to_string(),
                    requester_chain_id: chain.id(),
                },
            );
        })
        .await;

    // Query the login result again using the new loginResultFor query
    let QueryOutcome { response, .. } = chain
        .graphql_query(
            application_id,
            &format!("query {{ loginResultFor(chainId: \"{}\") {{ success isNewUser message }} }}", chain.id()),
        )
        .await;

    let success = response["loginResultFor"]["success"]
        .as_bool()
        .expect("Failed to get success");
    let is_new_user = response["loginResultFor"]["isNewUser"]
        .as_bool()
        .expect("Failed to get isNewUser");

    assert!(success);
    assert!(!is_new_user); // Should be false for existing user
}

/// Tests concurrent user management - simulates multiple chains registering at the same time
#[tokio::test(flavor = "multi_thread")]
async fn concurrent_user_test() {
    let (validator, module_id) =
        TestValidator::with_current_module::<flappy::FlappyAbi, (), InstantiationArgument>().await;
    
    // Create leaderboard chain with admin
    let mut leaderboard_chain = validator.new_chain().await;
    let leaderboard_args = InstantiationArgument {
        player_name: "leaderboard".to_string(),
        admin_username: Some("admin".to_string()),
        admin_hash: Some("admin_hash".to_string()),
    };
    let leaderboard_app_id = leaderboard_chain
        .create_application(module_id, (), leaderboard_args, vec![])
        .await;

    // Setup as leaderboard chain
    leaderboard_chain
        .add_block(|block| {
            block.with_operation(
                leaderboard_app_id,
                Operation::SetupGame {
                    leaderboard_chain_id: leaderboard_chain.id(),
                    leaderboard_name: "leaderboard".to_string(),
                },
            );
        })
        .await;

    // Create two different "user" chains
    let mut user1_chain = validator.new_chain().await;
    let mut user2_chain = validator.new_chain().await;
    
    let user1_args = InstantiationArgument {
        player_name: "user1".to_string(),
        admin_username: None,
        admin_hash: None,
    };
    let user2_args = InstantiationArgument {
        player_name: "user2".to_string(),
        admin_username: None,
        admin_hash: None,
    };
    
    let _user1_app_id = user1_chain
        .create_application(module_id, (), user1_args, vec![])
        .await;
    let _user2_app_id = user2_chain
        .create_application(module_id, (), user2_args, vec![])
        .await;

    // Both users register on the leaderboard chain
    leaderboard_chain
        .add_block(|block| {
            // User 1 registers
            block.with_operation(
                leaderboard_app_id,
                Operation::LoginOrRegister {
                    username: "alice".to_string(),
                    hash: "alice_hash".to_string(),
                    requester_chain_id: user1_chain.id(),
                },
            );
            // User 2 registers (in same block)
            block.with_operation(
                leaderboard_app_id,
                Operation::LoginOrRegister {
                    username: "bob".to_string(),
                    hash: "bob_hash".to_string(),
                    requester_chain_id: user2_chain.id(),
                },
            );
        })
        .await;

    // Query User 1's result (should be Alice's registration)
    let QueryOutcome { response: user1_response, .. } = leaderboard_chain
        .graphql_query(
            leaderboard_app_id,
            &format!("query {{ loginResultFor(chainId: \"{}\") {{ success isNewUser user {{ username }} }} }}", user1_chain.id()),
        )
        .await;

    // Query User 2's result (should be Bob's registration)
    let QueryOutcome { response: user2_response, .. } = leaderboard_chain
        .graphql_query(
            leaderboard_app_id,
            &format!("query {{ loginResultFor(chainId: \"{}\") {{ success isNewUser user {{ username }} }} }}", user2_chain.id()),
        )
        .await;

    // Debug: Print the responses
    println!("User 1 response: {:?}", user1_response);
    println!("User 2 response: {:?}", user2_response);
    
    // Verify each user gets their own result
    if let Some(result1) = user1_response["loginResultFor"].as_object() {
        assert!(result1["success"].as_bool().unwrap_or(false));
        assert!(result1["isNewUser"].as_bool().unwrap_or(false));
        assert_eq!(result1["user"]["username"].as_str().unwrap_or(""), "alice");
        println!("✅ User 1 (Alice) got correct result");
    } else {
        println!("❌ User 1 result not found");
    }

    if let Some(result2) = user2_response["loginResultFor"].as_object() {
        assert!(result2["success"].as_bool().unwrap_or(false));
        assert!(result2["isNewUser"].as_bool().unwrap_or(false));
        assert_eq!(result2["user"]["username"].as_str().unwrap_or(""), "bob");
        println!("✅ User 2 (Bob) got correct result");
    } else {
        println!("❌ User 2 result not found");
    }
}
