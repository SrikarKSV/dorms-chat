import { Form, useLocation, useNavigate } from 'react-router-dom';
import { copyToClipboard } from '../utils';
import { useEffect, useState, useRef } from 'react';
import toast from 'react-hot-toast';

export default function ChatRoom() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const ws = useRef<WebSocket | null>(null);
  const scrollIntoView = useRef<HTMLSpanElement>(null);
  const [messages, setMessages] = useState<
    { type: string; from: string; message: string; id: string }[]
  >([]);

  function sendMessage(e: any) {
    e.preventDefault();

    if (e.target.message.value === '') {
      return toast.error('Please enter a message');
    }

    ws.current?.send(
      JSON.stringify({
        type: 'MESSAGE',
        data: {
          text: e.target.message.value,
        },
        dormId: state.dormId,
        username: state.username,
      })
    );

    e.target.reset();
  }

  useEffect(() => {
    if (state === null || state.username === null || state.dormId === null) {
      toast.error('Please try again!', {
        duration: 10000,
      });
      return navigate('/', { replace: true });
    }

    if (state.message !== null) {
      toast.success(state.message);
    }

    ws.current = new WebSocket('wss://chocolate-caiman-sari.cyclic.app');

    ws.current.addEventListener('open', () => {
      ws.current?.send(
        JSON.stringify({
          type: 'JOIN',
          dormId: state.dormId,
          username: state.username,
        })
      );
    });

    ws.current.addEventListener('error', () => {
      toast.error('Lost connection to server', {
        duration: 10000,
      });
      return navigate('/', { replace: true });
    });

    ws.current.addEventListener('close', () => {
      toast.error('Connection was closed', {
        duration: 10000,
      });
      return navigate('/', { replace: true });
    });

    return () => {
      ws.current?.close();
    };
  }, []);

  useEffect(() => {
    if (!ws.current) return;

    ws.current.addEventListener('message', (data) => {
      const { type, from, message, id } = JSON.parse(data.data);

      if (type === 'ERROR') {
        toast.error(message, {
          duration: 10000,
        });
        return navigate('/', { replace: true });
      } else {
        if (type === 'JOINED' && from === state.username) {
          toast.success('Welcome to the dorm!');
        }

        setMessages((prevMessages) => [
          ...prevMessages,
          {
            type,
            from,
            message,
            id,
          },
        ]);
      }

      console.log({ type, from, message });
    });
  }, []);

  useEffect(() => {
    if (scrollIntoView.current !== null)
      scrollIntoView.current.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="chatroom">
      <p className="roomid">
        dorm id:{' '}
        <span
          className="id"
          onClick={(evt) => copyToClipboard(evt.currentTarget.innerText)}
        >
          {state.dormId}
        </span>{' '}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
          className="clipboard"
        >
          <path d="M7.5 3.375c0-1.036.84-1.875 1.875-1.875h.375a3.75 3.75 0 013.75 3.75v1.875C13.5 8.161 14.34 9 15.375 9h1.875A3.75 3.75 0 0121 12.75v3.375C21 17.16 20.16 18 19.125 18h-9.75A1.875 1.875 0 017.5 16.125V3.375z" />
          <path d="M15 5.25a5.23 5.23 0 00-1.279-3.434 9.768 9.768 0 016.963 6.963A5.23 5.23 0 0017.25 7.5h-1.875A.375.375 0 0115 7.125V5.25zM4.875 6H6v10.125A3.375 3.375 0 009.375 19.5H16.5v1.125c0 1.035-.84 1.875-1.875 1.875h-9.75A1.875 1.875 0 013 20.625V7.875C3 6.839 3.84 6 4.875 6z" />
        </svg>
      </p>
      <div className="chats">
        {messages &&
          messages.length > 0 &&
          messages.map((message) => {
            if (message.type === 'MESSAGE') {
              return (
                <div
                  className={
                    message.from === state.username ? 'chat-right' : 'chat-left'
                  }
                  key={message.id}
                >
                  <small>{message.from}</small>
                  <p>{message.message}</p>
                </div>
              );
            }

            return (
              <div className="chat-info" key={message.id}>
                <small>{message.message}</small>
              </div>
            );
          })}
        <span ref={scrollIntoView}></span>
      </div>
      <Form onSubmit={sendMessage} className="sendMessage">
        <input type="text" name="message" required />
        <button type="submit" disabled={!(ws.current?.readyState === 1)}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="w-6 h-6"
          >
            <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
          </svg>
        </button>
      </Form>
    </div>
  );
}
