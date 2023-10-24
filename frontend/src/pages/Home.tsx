import { ActionFunction, useFetcher, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';

export default function Home() {
  const fetcher = useFetcher();
  const navigate = useNavigate();
  const isSubmitting = fetcher.state === 'submitting';

  useEffect(() => {
    if (fetcher.data?.type === 'JOINED') {
      return navigate('chatroom', {
        state: {
          username: fetcher.data.username,
          dormId: fetcher.data.dormId,
          message: fetcher.data.message,
        },
      });
    }
  }, [fetcher.data]);

  const [isCreateDorm, setIsCreateDorm] = useState(false);
  const [isJoinDorm, setIsJoinDorm] = useState(false);

  return (
    <>
      {isCreateDorm && (
        <fetcher.Form className="form" method="post">
          <input type="text" name="username" placeholder="username" required />
          <input type="hidden" name="_action" value="createDorm" />
          <button
            type="submit"
            className="btn btn--yellow btn--sm"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Creating...' : 'Create dorm'}
          </button>
        </fetcher.Form>
      )}
      {isJoinDorm && (
        <fetcher.Form className="form" method="post">
          <input type="text" name="username" placeholder="username" required />
          <input type="text" name="dormId" placeholder="dorm id" />
          <input type="hidden" name="_action" value="joinDorm" />
          <button
            type="submit"
            className="btn btn--blue btn--sm"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Joining...' : 'Join dorm'}
          </button>
        </fetcher.Form>
      )}
      {!isCreateDorm && !isJoinDorm && (
        <div className="home-button">
          <button
            className="btn btn--yellow"
            onClick={() => setIsCreateDorm(true)}
          >
            Create dorm
          </button>
          <button className="btn btn--blue" onClick={() => setIsJoinDorm(true)}>
            Join dorm
          </button>
        </div>
      )}
    </>
  );
}

export const handleDorm: ActionFunction = async ({ request }) => {
  const formData = await request.formData();
  const username = formData.get('username');
  const action = formData.get('_action');
  const dormId = formData.get('dormId');
  let res;

  if (username !== null && username?.toString().length === 0) {
    toast.error('username is required!');
    return { type: 'ERROR' };
  }

  if (action?.toString() === 'createDorm')
    res = await fetch('https://dorms-chat.onrender.com/createDorm', {
      method: 'POST',
    });
  else
    res = await fetch('https://dorms-chat.onrender.com/joinDorm', {
      method: 'post',
      body: JSON.stringify({ dormId }),
    });

  if (!res.ok) {
    toast.error(await res.text());
    return { type: 'ERROR' };
  }

  return {
    type: 'JOINED',
    username: username,
    dormId: await res.text(),
    message: dormId === '' ? 'Joined random dorm' : null,
  };
};
