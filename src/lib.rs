use async_graphql::{Request, Response};
use linera_sdk::{
    graphql::GraphQLMutationRoot,
    linera_base_types::{ChainId, ContractAbi, ServiceAbi},
};
use serde::{Deserialize, Serialize};

pub struct FlappyAbi;

impl ContractAbi for FlappyAbi {
    type Operation = Operation;
    type Response = ();
}

impl ServiceAbi for FlappyAbi {
    type Query = Request;
    type QueryResponse = Response;
}

// Application parameters - can be set after deployment
#[derive(Debug, Clone, Deserialize, Serialize, Default)]
pub struct ApplicationParameters {
    pub leaderboard_chain_id: Option<ChainId>,
}

// User management structures
#[derive(Debug, Clone, Deserialize, Serialize, async_graphql::Enum, Copy, PartialEq, Eq)]
pub enum UserRole {
    Admin,
    Player,
}

#[derive(Debug, Clone, Deserialize, Serialize, async_graphql::SimpleObject)]
pub struct User {
    pub username: String,
    pub hash: String, // SHA-256 hash of username+password
    pub role: UserRole,
    pub created_at: u64, // timestamp
    pub chain_id: Option<ChainId>, // user's personal chain
}

#[derive(Debug, Clone, Serialize, Deserialize, async_graphql::SimpleObject)]
pub struct LoginResult {
    pub success: bool,
    pub user: Option<User>,
    pub message: String,
    pub is_new_user: bool,
}

// Instantiation argument for creating the application
#[derive(Debug, Clone, Deserialize, Serialize)]
pub struct InstantiationArgument {
    pub player_name: String,
    pub admin_username: Option<String>, // Only for leaderboard chain
    pub admin_hash: Option<String>,     // Only for leaderboard chain
}

#[derive(Debug, Deserialize, Serialize, GraphQLMutationRoot)]
pub enum Operation {
    // Setup operation to configure the game (only works once)
    SetupGame {
        leaderboard_chain_id: ChainId,
        leaderboard_name: String,
    },
    // User management operations
    LoginOrRegister {
        username: String,
        hash: String,
        requester_chain_id: ChainId, // Track which chain made the request
    },
    DeleteUser {
        caller_chain_id: ChainId,
        username: String,
    },
    // Practice mode operations
    SubmitPracticeScore {
        username: String,
        score: u64,
    },
    // Tournament management operations
    CreateTournament {
        caller_chain_id: ChainId,
        name: String,
        description: String,
        start_time: Option<u64>, // Optional scheduled start time
        end_time: Option<u64>, // Optional scheduled end time
    },
    JoinTournament {
        tournament_id: String,
        username: String,
    },
    StartTournament {
        caller_chain_id: ChainId,
        tournament_id: String,
    },
    EndTournament {
        caller_chain_id: ChainId,
        tournament_id: String,
        results: Vec<TournamentResult>,
    },
    PinTournament {
        caller_chain_id: ChainId,
        tournament_id: String,
        pin: bool, // true to pin, false to unpin
    },
    UpdateTournament {
        caller_chain_id: ChainId,
        tournament_id: String,
        name: Option<String>,
        description: Option<String>,
        start_time: Option<u64>,
        end_time: Option<u64>,
    },
    DeleteTournament {
        caller_chain_id: ChainId,
        tournament_id: String,
    },
    SubmitTournamentScore {
        tournament_id: String,
        username: String,
        score: u64,
    },
}

// Add message types for cross-chain communication
#[derive(Debug, Deserialize, Serialize)]
pub enum FlappyMessage {
    // Practice mode messages
    UpdatePracticeBest {
        username: String,
        score: u64,
        player_chain_id: ChainId,
    },
    // Tournament mode messages
    SubmitTournamentScore {
        tournament_id: String,
        username: String,
        score: u64,
        player_chain_id: ChainId,
    },
    TournamentUpdate {
        tournament_id: String,
        tournament: Tournament,
    },
    RequestTournamentData {
        tournament_id: String,
        requester_chain_id: ChainId,
    },
}

// Leaderboard entry structure (for tournaments)
#[derive(Debug, Clone, Deserialize, Serialize, async_graphql::SimpleObject)]
pub struct LeaderboardEntry {
    pub player_name: String,
    pub score: u64,
    pub chain_id: ChainId,
    pub timestamp: u64,
}

// Practice mode leaderboard entry
#[derive(Debug, Clone, Deserialize, Serialize, async_graphql::SimpleObject)]
pub struct PracticeEntry {
    pub username: String,
    pub score: u64,
    pub chain_id: ChainId,
    pub timestamp: u64,
}

// Tournament management structures
#[derive(Debug, Clone, Deserialize, Serialize, async_graphql::Enum, Copy, PartialEq, Eq)]
pub enum TournamentStatus {
    Registration, // Players can join
    Active,      // Tournament is running
    Ended,       // Tournament finished
}

#[derive(Debug, Clone, Deserialize, Serialize, async_graphql::SimpleObject)]
pub struct Tournament {
    pub id: String,
    pub name: String,
    pub description: String,
    pub creator: String, // Admin who created it
    pub status: TournamentStatus,
    pub start_time: Option<u64>, // timestamp
    pub end_time: Option<u64>, // timestamp
    pub participants: Vec<String>, // usernames
    pub results: Vec<TournamentResult>, // Final results
    pub created_at: u64,
    pub is_pinned: bool, // Admin can pin tournaments
    pub pinned_at: Option<u64>, // When it was pinned
    pub pinned_by: Option<String>, // Which admin pinned it
}

#[derive(Debug, Clone, Deserialize, Serialize, async_graphql::SimpleObject, async_graphql::InputObject)]
#[graphql(input_name = "TournamentResultInput")]
pub struct TournamentResult {
    pub username: String,
    pub score: u64,
    pub rank: u32,
    pub chain_id: ChainId,
    pub timestamp: u64,
}

#[cfg(test)]
mod tests {
    use super::*;
    use linera_sdk::linera_base_types::ChainId;
    use std::str::FromStr;

    fn test_chain_id() -> ChainId {
        ChainId::from_str("0000000000000000000000000000000000000000000000000000000000000000").unwrap()
    }

    #[test]
    fn test_leaderboard_entry_creation() {
        let chain_id = test_chain_id();
        let entry = LeaderboardEntry {
            player_name: "test_player".to_string(),
            score: 1000,
            chain_id,
            timestamp: 1234567890,
        };
        
        assert_eq!(entry.player_name, "test_player");
        assert_eq!(entry.score, 1000);
        assert_eq!(entry.timestamp, 1234567890);
    }

    #[test]
    fn test_leaderboard_sorting() {
        let chain_id = test_chain_id();
        let mut entries = vec![
            LeaderboardEntry {
                player_name: "player1".to_string(),
                score: 100,
                chain_id,
                timestamp: 1000,
            },
            LeaderboardEntry {
                player_name: "player2".to_string(),
                score: 200,
                chain_id,
                timestamp: 2000,
            },
            LeaderboardEntry {
                player_name: "player3".to_string(),
                score: 150,
                chain_id,
                timestamp: 1500,
            },
        ];

        // Sort by score descending (highest first)
        entries.sort_by(|a, b| b.score.cmp(&a.score));
        
        assert_eq!(entries[0].player_name, "player2");
        assert_eq!(entries[0].score, 200);
        assert_eq!(entries[1].player_name, "player3");
        assert_eq!(entries[1].score, 150);
        assert_eq!(entries[2].player_name, "player1");
        assert_eq!(entries[2].score, 100);
    }

    #[test]
    fn test_application_parameters_default() {
        let params = ApplicationParameters::default();
        assert!(params.leaderboard_chain_id.is_none());
    }

    #[test]
    fn test_operations_serialization() {
        let op = Operation::SubmitPracticeScore { 
            username: "test_user".to_string(),
            score: 42 
        };
        let serialized = serde_json::to_string(&op).unwrap();
        let deserialized: Operation = serde_json::from_str(&serialized).unwrap();
        
        match deserialized {
            Operation::SubmitPracticeScore { username, score } => {
                assert_eq!(username, "test_user");
                assert_eq!(score, 42);
            },
            _ => panic!("Wrong operation type"),
        }
    }

    #[test]
    fn test_message_types() {
        let chain_id = test_chain_id();
        let message = FlappyMessage::UpdatePracticeBest {
            username: "test".to_string(),
            score: 500,
            player_chain_id: chain_id,
        };

        match message {
            FlappyMessage::UpdatePracticeBest { username, score, .. } => {
                assert_eq!(username, "test");
                assert_eq!(score, 500);
            },
            _ => panic!("Wrong message type"),
        }
    }

    #[test]
    fn test_user_creation() {
        let chain_id = test_chain_id();
        let user = User {
            username: "testuser".to_string(),
            hash: "hash123".to_string(),
            role: UserRole::Player,
            created_at: 1234567890,
            chain_id: Some(chain_id),
        };
        
        assert_eq!(user.username, "testuser");
        assert_eq!(user.hash, "hash123");
        assert!(matches!(user.role, UserRole::Player));
        assert_eq!(user.created_at, 1234567890);
    }

    #[test]
    fn test_user_role() {
        let admin = UserRole::Admin;
        let player = UserRole::Player;
        
        assert!(matches!(admin, UserRole::Admin));
        assert!(matches!(player, UserRole::Player));
    }

    #[test]
    fn test_login_result_success() {
        let chain_id = test_chain_id();
        let user = User {
            username: "testuser".to_string(),
            hash: "hash123".to_string(),
            role: UserRole::Player,
            created_at: 1234567890,
            chain_id: Some(chain_id),
        };

        let result = LoginResult {
            success: true,
            user: Some(user.clone()),
            message: "Login successful".to_string(),
            is_new_user: false,
        };
        
        assert!(result.success);
        assert!(result.user.is_some());
        assert_eq!(result.message, "Login successful");
        assert!(!result.is_new_user);
        assert_eq!(result.user.unwrap().username, "testuser");
    }

    #[test]
    fn test_login_result_failure() {
        let result = LoginResult {
            success: false,
            user: None,
            message: "Invalid password".to_string(),
            is_new_user: false,
        };
        
        assert!(!result.success);
        assert!(result.user.is_none());
        assert_eq!(result.message, "Invalid password");
        assert!(!result.is_new_user);
    }

    #[test]
    fn test_login_result_registration() {
        let chain_id = test_chain_id();
        let user = User {
            username: "newuser".to_string(),
            hash: "newhash".to_string(),
            role: UserRole::Player,
            created_at: 1234567890,
            chain_id: Some(chain_id),
        };

        let result = LoginResult {
            success: true,
            user: Some(user),
            message: "User registered successfully".to_string(),
            is_new_user: true,
        };
        
        assert!(result.success);
        assert!(result.user.is_some());
        assert_eq!(result.message, "User registered successfully");
        assert!(result.is_new_user);
    }

    #[test]
    fn test_login_operation_serialization() {
        let chain_id = test_chain_id();
        let op = Operation::LoginOrRegister {
            username: "testuser".to_string(),
            hash: "testhash".to_string(),
            requester_chain_id: chain_id,
        };
        
        let serialized = serde_json::to_string(&op).unwrap();
        let deserialized: Operation = serde_json::from_str(&serialized).unwrap();
        
        match deserialized {
            Operation::LoginOrRegister { username, hash, requester_chain_id } => {
                assert_eq!(username, "testuser");
                assert_eq!(hash, "testhash");
                assert_eq!(requester_chain_id, chain_id);
            },
            _ => panic!("Wrong operation type"),
        }
    }

    #[test]
    fn test_practice_entry_creation() {
        let chain_id = test_chain_id();
        let entry = PracticeEntry {
            username: "player1".to_string(),
            score: 500,
            chain_id,
            timestamp: 1234567890,
        };
        
        assert_eq!(entry.username, "player1");
        assert_eq!(entry.score, 500);
        assert_eq!(entry.chain_id, chain_id);
        assert_eq!(entry.timestamp, 1234567890);
    }

    #[test]
    fn test_practice_score_operation_serialization() {
        let op = Operation::SubmitPracticeScore {
            username: "player1".to_string(),
            score: 750,
        };
        
        let serialized = serde_json::to_string(&op).unwrap();
        let deserialized: Operation = serde_json::from_str(&serialized).unwrap();
        
        match deserialized {
            Operation::SubmitPracticeScore { username, score } => {
                assert_eq!(username, "player1");
                assert_eq!(score, 750);
            },
            _ => panic!("Wrong operation type"),
        }
    }

    #[test]
    fn test_practice_message_serialization() {
        let chain_id = test_chain_id();
        let message = FlappyMessage::UpdatePracticeBest {
            username: "player1".to_string(),
            score: 1000,
            player_chain_id: chain_id,
        };
        
        let serialized = serde_json::to_string(&message).unwrap();
        let deserialized: FlappyMessage = serde_json::from_str(&serialized).unwrap();
        
        match deserialized {
            FlappyMessage::UpdatePracticeBest { username, score, player_chain_id } => {
                assert_eq!(username, "player1");
                assert_eq!(score, 1000);
                assert_eq!(player_chain_id, chain_id);
            },
            _ => panic!("Wrong message type"),
        }
    }

    #[test]
    fn test_tournament_creation() {
        let _chain_id = test_chain_id();
        let tournament = Tournament {
            id: "tournament1".to_string(),
            name: "Test Tournament".to_string(),
            description: "A test tournament".to_string(),
            creator: "admin".to_string(),
            status: TournamentStatus::Registration,
            start_time: Some(1234567890),
            end_time: None,
            participants: vec!["player1".to_string(), "player2".to_string()],
            results: vec![],
            created_at: 1234567890,
            is_pinned: false,
            pinned_at: None,
            pinned_by: None,
        };
        
        assert_eq!(tournament.id, "tournament1");
        assert_eq!(tournament.name, "Test Tournament");
        assert_eq!(tournament.creator, "admin");
        assert!(matches!(tournament.status, TournamentStatus::Registration));
        assert_eq!(tournament.participants.len(), 2);
        assert!(!tournament.is_pinned);
    }

    #[test]
    fn test_tournament_status() {
        let registration = TournamentStatus::Registration;
        let active = TournamentStatus::Active;
        let ended = TournamentStatus::Ended;
        
        assert!(matches!(registration, TournamentStatus::Registration));
        assert!(matches!(active, TournamentStatus::Active));
        assert!(matches!(ended, TournamentStatus::Ended));
    }

    #[test]
    fn test_tournament_result() {
        let chain_id = test_chain_id();
        let result = TournamentResult {
            username: "player1".to_string(),
            score: 1500,
            rank: 1,
            chain_id,
            timestamp: 1234567890,
        };
        
        assert_eq!(result.username, "player1");
        assert_eq!(result.score, 1500);
        assert_eq!(result.rank, 1);
        assert_eq!(result.timestamp, 1234567890);
    }

    #[test]
    fn test_tournament_operations_serialization() {
        let op = Operation::CreateTournament {
            caller_chain_id: test_chain_id(),
            name: "Test Tournament".to_string(),
            description: "A test tournament".to_string(),
            start_time: Some(1234567890),
            end_time: Some(1234567890 + 3600), // 1 hour later
        };
        
        let serialized = serde_json::to_string(&op).unwrap();
        let deserialized: Operation = serde_json::from_str(&serialized).unwrap();
        
        match deserialized {
            Operation::CreateTournament { caller_chain_id, name, description, start_time, end_time } => {
                assert_eq!(caller_chain_id, test_chain_id());
                assert_eq!(name, "Test Tournament");
                assert_eq!(description, "A test tournament");
                assert_eq!(start_time, Some(1234567890));
                assert_eq!(end_time, Some(1234567890 + 3600));
            },
            _ => panic!("Wrong operation type"),
        }
    }

    #[test]
    fn test_tournament_pin_operation() {
        let op = Operation::PinTournament {
            caller_chain_id: test_chain_id(),
            tournament_id: "tournament1".to_string(),
            pin: true,
        };
        
        let serialized = serde_json::to_string(&op).unwrap();
        let deserialized: Operation = serde_json::from_str(&serialized).unwrap();
        
        match deserialized {
            Operation::PinTournament { caller_chain_id, tournament_id, pin } => {
                assert_eq!(caller_chain_id, test_chain_id());
                assert_eq!(tournament_id, "tournament1");
                assert!(pin);
            },
            _ => panic!("Wrong operation type"),
        }
    }

    #[test]
    fn test_tournament_delete_operation() {
        let op = Operation::DeleteTournament {
            caller_chain_id: test_chain_id(),
            tournament_id: "tournament1".to_string(),
        };
        
        let serialized = serde_json::to_string(&op).unwrap();
        let deserialized: Operation = serde_json::from_str(&serialized).unwrap();
        
        match deserialized {
            Operation::DeleteTournament { caller_chain_id, tournament_id } => {
                assert_eq!(caller_chain_id, test_chain_id());
                assert_eq!(tournament_id, "tournament1");
            },
            _ => panic!("Wrong operation type"),
        }
    }

    #[test]
    fn test_tournament_message_serialization() {
        let chain_id = test_chain_id();
        let message = FlappyMessage::SubmitTournamentScore {
            tournament_id: "tournament1".to_string(),
            username: "player1".to_string(),
            score: 1000,
            player_chain_id: chain_id,
        };
        
        let serialized = serde_json::to_string(&message).unwrap();
        let deserialized: FlappyMessage = serde_json::from_str(&serialized).unwrap();
        
        match deserialized {
            FlappyMessage::SubmitTournamentScore { tournament_id, username, score, player_chain_id } => {
                assert_eq!(tournament_id, "tournament1");
                assert_eq!(username, "player1");
                assert_eq!(score, 1000);
                assert_eq!(player_chain_id, chain_id);
            },
            _ => panic!("Wrong message type"),
        }
    }

    #[test]
    fn test_submit_tournament_score_operation() {
        let op = Operation::SubmitTournamentScore {
            tournament_id: "tournament_123".to_string(),
            username: "player1".to_string(),
            score: 1500,
        };
        
        let serialized = serde_json::to_string(&op).unwrap();
        let deserialized: Operation = serde_json::from_str(&serialized).unwrap();
        
        match deserialized {
            Operation::SubmitTournamentScore { tournament_id, username, score } => {
                assert_eq!(tournament_id, "tournament_123");
                assert_eq!(username, "player1");
                assert_eq!(score, 1500);
            },
            _ => panic!("Wrong operation type"),
        }
    }

    #[test]
    fn test_tournament_status_transitions() {
        // Test that all tournament statuses can be created and compared
        let registration = TournamentStatus::Registration;
        let active = TournamentStatus::Active;
        let ended = TournamentStatus::Ended;
        
        assert_ne!(registration, active);
        assert_ne!(active, ended);
        assert_ne!(registration, ended);
    }

    #[test]
    fn test_tournament_time_validation() {
        // Test time validation logic (seconds to microseconds conversion)
        let start_time_seconds = 1234567890u64;
        let end_time_seconds = start_time_seconds + 3600; // 1 hour later
        
        let start_time_micros = start_time_seconds * 1_000_000;
        let end_time_micros = end_time_seconds * 1_000_000;
        
        assert!(end_time_micros > start_time_micros);
        assert_eq!(end_time_micros - start_time_micros, 3600 * 1_000_000); // 1 hour in microseconds
    }

    #[test]
    fn test_tournament_auto_start_timing() {
        let current_time = 1234567890_000_000u64; // Current time in microseconds
        let start_time = 1234567800_000_000u64;   // Start time 90 seconds ago
        let end_time = 1234568000_000_000u64;     // End time 110 seconds from start
        
        // Tournament should auto-start if current_time >= start_time
        assert!(current_time >= start_time, "Tournament should be ready to start");
        assert!(current_time < end_time, "Tournament should not be ready to end yet");
    }

    #[test]
    fn test_tournament_auto_end_timing() {
        let current_time = 1234568100_000_000u64; // Current time in microseconds
        let start_time = 1234567800_000_000u64;   // Start time 300 seconds ago
        let end_time = 1234568000_000_000u64;     // End time 100 seconds ago
        
        // Tournament should auto-end if current_time >= end_time
        assert!(current_time >= start_time, "Tournament should have started");
        assert!(current_time >= end_time, "Tournament should be ready to end");
    }

    #[test]
    fn test_tournament_with_scheduled_times() {
        let _chain_id = test_chain_id();
        let base_time = 1234567890u64; // Base time in seconds
        
        let tournament = Tournament {
            id: "scheduled_tournament".to_string(),
            name: "Scheduled Test Tournament".to_string(),
            description: "A tournament with scheduled start and end times".to_string(),
            creator: "admin".to_string(),
            status: TournamentStatus::Registration,
            start_time: Some(base_time * 1_000_000), // Convert to microseconds
            end_time: Some((base_time + 3600) * 1_000_000), // 1 hour later
            participants: vec![],
            results: vec![],
            created_at: base_time * 1_000_000,
            is_pinned: false,
            pinned_at: None,
            pinned_by: None,
        };
        
        assert_eq!(tournament.status, TournamentStatus::Registration);
        assert!(tournament.start_time.is_some());
        assert!(tournament.end_time.is_some());
        assert!(tournament.end_time.unwrap() > tournament.start_time.unwrap());
    }

    #[test]
    fn test_tournament_without_scheduled_times() {
        let tournament = Tournament {
            id: "manual_tournament".to_string(),
            name: "Manual Test Tournament".to_string(),
            description: "A tournament without scheduled times".to_string(),
            creator: "admin".to_string(),
            status: TournamentStatus::Registration,
            start_time: None,
            end_time: None,
            participants: vec![],
            results: vec![],
            created_at: 1234567890_000_000,
            is_pinned: false,
            pinned_at: None,
            pinned_by: None,
        };
        
        assert_eq!(tournament.status, TournamentStatus::Registration);
        assert!(tournament.start_time.is_none());
        assert!(tournament.end_time.is_none());
    }

    #[test]
    fn test_delete_user_operation_serialization() {
        let chain_id = test_chain_id();
        let op = Operation::DeleteUser {
            caller_chain_id: chain_id,
            username: "testuser".to_string(),
        };
        
        let serialized = serde_json::to_string(&op).unwrap();
        let deserialized: Operation = serde_json::from_str(&serialized).unwrap();
        
        match deserialized {
            Operation::DeleteUser { caller_chain_id, username } => {
                assert_eq!(caller_chain_id, chain_id);
                assert_eq!(username, "testuser");
            },
            _ => panic!("Wrong operation type"),
        }
    }
}
