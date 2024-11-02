import React, { useState, useRef, useEffect, KeyboardEvent, ChangeEvent } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBurger, faPaperPlane } from "@fortawesome/free-solid-svg-icons";
import { useUser } from "./UserContext";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import "./styles.css";
import { baseUrl } from "./constants";
import ErrorMessage from "./ErrorMessage";
import ReactMarkdown from 'react-markdown';

interface Message {
  message: string;
  userRole: string;
  id?: string;
}

interface Chat {
  id: string;
  title: string;
  message: string;
}

interface User {
  fullName: string;
  email: string;
}

export default function Ameerchatbox() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [inputText, setInputText] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [recentChats, setRecentChats] = useState<Chat[]>([]);
  const [buttonBlur, setButtonBlur] = useState(false);
  const [showRecentChatButton, setShowRecentChatButton] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [navbarHeading, setNavbarHeading] = useState("New Chat!");
  const [firstAIResponseSet, setFirstAIResponseSet] = useState(false);
  const [promptSent, setPromptSent] = useState(false);
  const [errorMessage, setErrorMessage] = useState(""); // State for error messages
  const { user } = useUser() as { user: User };
  const navigate = useNavigate();
  const sideMenuRef = useRef<HTMLDivElement>(null);
  const { id } = useParams<{ id: string }>();

  useEffect(() => {
    if (id) {
      loadChatHistory(id);
    }
    fetchRecentChats();
  }, [id]);

  async function loadChatHistory(id: string) {
    const token = localStorage.getItem("token");

    try {
      const response = await axios.get(
        `${baseUrl}/api/v1/chat/${id}/chat_messages`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setMessages(response.data.data);
      console.log(response.data.data);
    } catch (e) {
      console.log(`Error Occured while fetching chat_history (${id}) :`, e);
    }
  }

  useEffect(() => {
    const handleOverlayClick = (e: MouseEvent) => {
      if (sideMenuRef.current && !sideMenuRef.current.contains(e.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    if (isMenuOpen) {
      document.addEventListener("click", handleOverlayClick);
    } else {
      document.removeEventListener("click", handleOverlayClick);
    }

    return () => {
      document.removeEventListener("click", handleOverlayClick);
    };
  }, [isMenuOpen]);

  useEffect(() => {
    if (errorMessage) {
      const timer = setTimeout(() => {
        setErrorMessage("");
      }, 4000);
      return () => clearTimeout(timer); // Clear timeout if component unmounts
    }
  }, [errorMessage]);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
    setShowRecentChatButton(true);
  };

  const getInitials = (name: string | undefined) => {
    if (!name) return "";
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase();
  };

  const handleLogoutClick = () => {
    localStorage.clear();
    navigate("/login");
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    setInputText(e.target.value);
  };

  const handleSendClick = async () => {
    if (inputText.trim()) {
      setButtonBlur(true);
      setIsSending(true);
      const newMessages = [
        ...messages,
        { message: inputText, userRole: "SENDER" },
      ];

      setMessages(newMessages);
      setInputText("");
      setPromptSent(true);

      try {
        const response = await axios.post(
          `${baseUrl}/api/v1/chat/prompt`,
          { chatRoomId: id ? id : null, message: inputText },
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );
        console.log(newMessages);
        console.log(response);
        const newId = response.data.data.chatRoomId;
        const aiResponse = response.data.data.message;

        if (!id) {
          navigate(`/ameerchatbox/${newId}`);
        }

        if (!firstAIResponseSet) {
          setNavbarHeading(aiResponse.split(" ").slice(0, 5).join(" ") + "...");
          setFirstAIResponseSet(true);

          setRecentChats([
            {
              id: newId,
              title: aiResponse.split(" ").slice(0, 5).join(" ") + "...",
              message: aiResponse,
            },
          ]);
        }

        const updatedMessages = [
          ...newMessages,
          { message: aiResponse, userRole: "ai-message", id: newId },
        ];
        setMessages(updatedMessages);
      } catch (error) {
        console.error("Failed to send prompt:", error);
        setErrorMessage("An error occurred while processing your request.");
      } finally {
        setIsSending(false);
        setButtonBlur(false);
      }
    }
  };

  const handleKeyPress = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSendClick();
    }
  };

  const handleNewChatClick = () => {
    setMessages([]); // Clear current chat messages
    setNavbarHeading("New Chat!");
    setFirstAIResponseSet(false); // Reset for new chat
    setPromptSent(false);
    setIsMenuOpen(false);
  };

  const fetchRecentChats = async () => {
    const token = localStorage.getItem("token");
    setIsLoading(true);
    try {
      const response = await axios.get(`${baseUrl}/api/v1/chat/recent`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const chats: Chat[] = response.data.data || [];
      setRecentChats(chats);
      if (chats.length === 0) {
        setRecentChats([{ id: "0", title: "No recent chats", message: "" }]);
      }
      setShowRecentChatButton(false);
    } catch (error) {
      console.error("Failed to fetch recent chats:", error);
      setErrorMessage("An error occurred while fetching recent chats.");
      setRecentChats([{ id: "0", title: "No recent chats", message: "" }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRecentChatsClick = () => {
    fetchRecentChats();
  };

  return (
    <div className="ameer">
      <div className="chatbox-top">
        <FontAwesomeIcon
          className="chat-toggleburger"
          icon={faBurger}
          onClick={toggleMenu}
        />
        <h4 className="chatbox-heading">{navbarHeading}</h4>
      </div>
      <div className="chatbox-prompt-container">
        <input
          className="propmt-text-box"
          type="text"
          placeholder="input a prompt..."
          value={isSending ? "Processing..." : inputText}
          onChange={handleInputChange}
          onKeyPress={handleKeyPress}
          disabled={isSending}
        />
        <FontAwesomeIcon
          className={`send-icon ${buttonBlur ? "blurred" : ""}`}
          icon={faPaperPlane}
          onClick={handleSendClick}
        />
      </div>
      {isMenuOpen && <div className="overlay"></div>}
      <NavBar
        isMenuOpen={isMenuOpen}
        sideMenuRef={sideMenuRef}
        toggleMenu={toggleMenu}
        user={user}
        getInitials={getInitials}
        handleLogoutClick={handleLogoutClick}
        showRecentChatButton={showRecentChatButton}
        promptSent={promptSent}
        handleRecentChatsClick={handleRecentChatsClick}
        isLoading={isLoading}
        recentChats={recentChats}
        handleNewChatClick={handleNewChatClick}
      />
      <div className="dark-mode">
        <ChaUI messages={messages} />
      </div>
      <ErrorMessage message={errorMessage} /> {/* Display the error message */}
    </div>
  );
}

interface NavBarProps {
  isMenuOpen: boolean;
  sideMenuRef: React.RefObject<HTMLDivElement>;
  toggleMenu: () => void;
  user: User;
  getInitials: (name: string | undefined) => string;
  handleLogoutClick: () => void;
  showRecentChatButton: boolean;
  promptSent: boolean;
  handleRecentChatsClick: () => void;
  isLoading: boolean;
  recentChats: Chat[];
  handleNewChatClick: () => void;
}

const NavBar = ({
  isMenuOpen,
  sideMenuRef,
  toggleMenu,
  user,
  getInitials,
  handleLogoutClick,
  showRecentChatButton,
  promptSent,
  handleRecentChatsClick,
  isLoading,
  recentChats = [],
  handleNewChatClick,
}: NavBarProps) => {
  const navigate = useNavigate();
  const handleRecentChatClick = (chatId: string) => {
    navigate(`/ameerchatbox/${chatId}`);
    toggleMenu(); // Close the menu after selecting a recent chat
  };
  return (
    <div className={`side-menu ${isMenuOpen ? "open" : ""}`} ref={sideMenuRef}>
      <div className="chat-profile-container">
        <div className="chat-profile-wrapper">
          <button className="cancel-button" onClick={toggleMenu}>
            ×
          </button>
          <h2 className="chat-profile">
            {user ? getInitials(user.fullName) : "N/A"}
          </h2>
          <p>{user ? user.fullName : "N/A"}</p>
          <div className="user-email">
            <p className="email">{user ? user.email : "N/A"}</p>
            <p className="logout-text" onClick={handleLogoutClick}>
              Logout
            </p>
          </div>
        </div>
      </div>
      <div className="recent-chats">
        {showRecentChatButton && !promptSent && (
          <button className="get-recent-chat" onClick={handleRecentChatsClick}>
            {isLoading ? "Loading..." : "Get Recent Chats"}
          </button>
        )}
        <h3>Recent Chats</h3>
        {recentChats.length > 0
          ? recentChats.map((chat, index) => (
              <div
                onClick={() => handleRecentChatClick(chat.id)} // Close the menu and navigate
                key={index}
                className="recent-chat-item"
              >
                {chat.title}
              </div>
            ))
          : !showRecentChatButton && (
              <div className="recent-chat-item">No recent chats</div>
            )}
      </div>
      <button className="new-chat-button" onClick={() => {
        navigate(`/ameerchatbox`);
        handleNewChatClick();
      }}>
        New Chat
      </button>
    </div>
  );
};

interface ChaUIProps {
  messages: Message[];
}

const ChaUI = ({ messages }: ChaUIProps) => {
  return (
    <div className="messages-container">
      {messages.map((msg, index) => (
        <div
          key={index}
          className={`message ${msg.userRole === "SENDER" ? "user-message" : "ai-message"}`}
        >
          <ReactMarkdown>{msg.message}</ReactMarkdown>
        </div>
      ))}
    </div>
  );
};
