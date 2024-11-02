import React, { useState, useRef, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBurger, faPaperPlane } from "@fortawesome/free-solid-svg-icons";
import { useUser } from "./UserContext";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import "./styles.css";
import { baseUrl } from "./constants";
import ErrorMessage from "./ErrorMessage";
import ReactMarkdown from 'react-markdown';

// Define types for the chat message and user
interface Message {
  message: string;
  userRole: string;
  id?: number; // Optional for AI messages
}

interface User {
  fullName: string;
  email: string;
}

// Define props for the NavBar component
interface NavBarProps {
  isMenuOpen: boolean;
  sideMenuRef: React.RefObject<HTMLDivElement>;
  toggleMenu: () => void;
  user: User | null;
  getInitials: (name: string) => string;
  handleLogoutClick: () => void;
  showRecentChatButton: boolean;
  promptSent: boolean;
  handleRecentChatsClick: () => void;
  isLoading: boolean;
  recentChats: { title: string; id?: number }[];
  handleNewChatClick: () => void;
}

// Define props for the ChaUI component
interface ChaUIProps {
  messages: Message[];
}

export default function Ameerchatbox() {
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const [inputText, setInputText] = useState<string>("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [recentChats, setRecentChats] = useState<{ title: string; message?: string; id?: number }[]>([]);
  const [buttonBlur, setButtonBlur] = useState<boolean>(false);
  const [showRecentChatButton, setShowRecentChatButton] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSending, setIsSending] = useState<boolean>(false);
  const [navbarHeading, setNavbarHeading] = useState<string>("New Chat!");
  const [firstAIResponseSet, setFirstAIResponseSet] = useState<boolean>(false);
  const [promptSent, setPromptSent] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>(""); // State for error messages
  const { user } = useUser();
  const navigate = useNavigate();
  const sideMenuRef = useRef<HTMLDivElement>(null);
  const { id } = useParams<{ id?: string }>();

  useEffect(() => {
    if (id) {
      loadChatHistory(id);
    }
    fetchRecentChats();
  }, [id]);

  async function loadChatHistory(id: string) {
    const token = localStorage.getItem("token");

    try {
      const response = await axios.get(`${baseUrl}/api/v1/chat/${id}/chat_messages`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setMessages(response.data.data);
      console.log(response.data.data);
    } catch (e) {
      console.log(`Error Occurred while fetching chat_history (${id}) :`, e);
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

  const getInitials = (name: string) => {
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputText(e.target.value);
  };

  const handleSendClick = async () => {
    if (inputText.trim()) {
      setButtonBlur(true);
      setIsSending(true);
      const newMessages: Message[] = [
        ...messages,
        { message: inputText, userRole: "SENDER" },
      ];

      setMessages(newMessages);
      setInputText("");
      setPromptSent(true);

      // chatprompt
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
              title: aiResponse.split(" ").slice(0, 5).join(" ") + "...",
              message: aiResponse,
            },
          ]);
        }

        const updatedMessages = [
            ...newMessages,
            {
              message: aiResponse,
              userRole: "ai-message",
              id: id ? parseInt(id as string) : undefined, // Ensure id is a number or undefined
            },
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

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
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

  // recentChats
  const fetchRecentChats = async () => {
    const token = localStorage.getItem("token");
    setIsLoading(true);
    try {
      const response = await axios.get(`${baseUrl}/api/v1/chat/recent`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const chats = response.data.data || [];
      setRecentChats(chats);
      if (chats.length === 0) {
        setRecentChats([{ title: "No recent chats", message: "" }]);
      }
      setShowRecentChatButton(false);
    } catch (error) {
      console.error("Failed to fetch recent chats:", error);
      setErrorMessage("An error occurred while fetching recent chats.");
      setRecentChats([{ title: "No recent chats", message: "" }]);
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
      {errorMessage && <ErrorMessage message={errorMessage} />}
    </div>
  );
}

// NavBar component
const NavBar: React.FC<NavBarProps> = ({
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
  recentChats,
  handleNewChatClick,
}) => {
  return (
    <div
      className={`side-menu ${isMenuOpen ? "open" : "closed"}`}
      ref={sideMenuRef}
    >
      <div className="user-section">
        <div className="initials">{getInitials(user?.fullName || "")}</div>
        <span className="user-email">{user?.email}</span>
      </div>
      <button onClick={handleNewChatClick} className="new-chat-button">
        New Chat
      </button>
      {showRecentChatButton && (
        <button
          onClick={handleRecentChatsClick}
          className="recent-chats-button"
          disabled={isLoading}
        >
          {isLoading ? "Loading..." : "Recent Chats"}
        </button>
      )}
      <button onClick={handleLogoutClick} className="logout-button">
        Logout
      </button>
    </div>
  );
};

// Chat UI component
const ChaUI: React.FC<ChaUIProps> = ({ messages }) => {
  return (
    <div className="chat-ui">
      {messages.map((message, index) => (
        <div
          key={index}
          className={`message ${
            message.userRole === "ai-message" ? "ai" : "user"
          }`}
        >
          <ReactMarkdown>{message.message}</ReactMarkdown>
        </div>
      ))}
    </div>
  );
}
