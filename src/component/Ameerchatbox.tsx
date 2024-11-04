import React, {
  useState,
  useRef,
  useEffect,
  ChangeEvent,
  KeyboardEvent,
} from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBurger, faPaperPlane } from "@fortawesome/free-solid-svg-icons";
import { useUser } from "./UserContext";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import "./styles.css";
import { baseUrl } from "./constants";
import ErrorMessage from "./ErrorMessage";
import ReactMarkdown from "react-markdown";

interface Message {
  id?: number;
  message: string;
  userRole: string;
}

interface Chat {
  id?: number;
  title: string;
  message: string;
}

export default function Ameerchatbox() {
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const [inputText, setInputText] = useState<string>("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [recentChats, setRecentChats] = useState<Chat[]>([]);
  const [buttonBlur, setButtonBlur] = useState<boolean>(false);
  const [showRecentChatButton, setShowRecentChatButton] =
    useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSending, setIsSending] = useState<boolean>(false);
  const [navbarHeading, setNavbarHeading] = useState<string>("New Chat!");
  const [firstAIResponseSet, setFirstAIResponseSet] = useState<boolean>(false);
  const [promptSent, setPromptSent] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");
  // const inputRef =useRef<HTMLInputElement>(null);
  // const sideMenuRef = useRef<HTMLDivElement>(null);


  

  const { user } = useUser();
  const navigate = useNavigate();
  const sideMenuRef = useRef<HTMLDivElement>(null);

  const { id } = useParams<{ id: string }>();

  useEffect(() => {
    if (id) {
      loadChatHistory(id);
    }
    fetchRecentChats();
  }, [id]);

  // useEffect(() => {
  //   if (inputRef.current) {
  //     inputRef.current.focus();
  //   }
  // }, []);

  useEffect(() => {
    if (errorMessage) {
      const timer = setTimeout(() => {
        setErrorMessage("");
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [errorMessage]);

  useEffect(() => {
    // Add event listener to close the menu when clicking outside
    function handleClickOutside(event: MouseEvent) {
      if (
        sideMenuRef.current &&
        !sideMenuRef.current.contains(event.target as Node) &&
        isMenuOpen
      ) {
        setIsMenuOpen(false); // Close the menu if clicking outside
      }
    }

    // Attach the event listener to the document
    document.addEventListener("mousedown", handleClickOutside);

    // Cleanup the event listener on component unmount
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isMenuOpen]);

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
      console.log(`Error Occurred while fetching chat_history (${id}) :`, e);
    }
  }

  useEffect(() => {
    if (errorMessage) {
      const timer = setTimeout(() => {
        setErrorMessage("");
      }, 4000);
      return () => clearTimeout(timer);
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
      const newMessages: Message[] = [
        ...messages,
        { message: inputText, userRole: "SENDER" },
      ];

      setMessages(newMessages);
      setInputText("");
      setPromptSent(true);

      try {
        const response = await axios.post(
          `${baseUrl}/api/v1/chat/prompt`,
          { chatRoomId: id ? parseInt(id) : null, message: inputText },
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );

        const newId = parseInt(response.data.data.chatRoomId); // Ensure newId is a number
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

        const updatedMessages: Message[] = [
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
    setMessages([]);
    setNavbarHeading("New Chat!");
    setFirstAIResponseSet(false);
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
        {/* Toggle button */}
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
      <ErrorMessage message={errorMessage} />
    </div>
  );
}
{
  /*Types  Declaration */
}
interface NavBarProps {
  isMenuOpen: boolean;
  sideMenuRef: React.RefObject<HTMLDivElement>;
  toggleMenu: () => void;
  user: { fullName: string; email: string } | null;
  getInitials: (name: string | undefined) => string;
  handleLogoutClick: () => void;
  showRecentChatButton: boolean;
  promptSent: boolean;
  handleRecentChatsClick: () => void;
  isLoading: boolean;
  recentChats: Chat[];
  handleNewChatClick: () => void;
}

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
  recentChats = [],
  handleNewChatClick,
}) => {
  const navigate = useNavigate();

  const handleRecentChatClick = (chatId: number) => {
    navigate(`/ameerchatbox/${chatId}`);
    toggleMenu();
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
                onClick={() => handleRecentChatClick(chat.id || index)}
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
      <button
        className="new-chat-button"
        onClick={() => {
          navigate(`/ameerchatbox`);
          handleNewChatClick();
        }}
      >
        New Chat
      </button>
    </div>
  );
};

interface ChaUIProps {
  messages: Message[];
  toggleMenu?: () => void;
}

const ChaUI: React.FC<ChaUIProps> = ({ messages, toggleMenu }) => {
  return (
    <div className="messages-container">
      {messages.map((msg, index) => (
        <div
          onClick={toggleMenu}
          key={index}
          className={`message ${
            msg.userRole === "SENDER" ? "user-message" : "ai-message"
          }`}
        >
          <ReactMarkdown>{msg.message}</ReactMarkdown>
        </div>
      ))}
    </div>
  );
};
