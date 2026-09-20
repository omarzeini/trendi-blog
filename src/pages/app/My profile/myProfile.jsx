import "../ProfilePage/ProfilePage.css";
//ICONS
import Edit from "../../../icons/Edit";
import Add from "../../../icons/Add";
import ImgIcon from "../../../icons/ImageIcon";
import DeleteIcon from "../../../icons/delete-icon";
import AlertIcon from "../../../icons/alert-icon";
//COMPONENTS
import Loader from "../../../components/ui/loader";
import Notify from "../../../components/ui/notify";
import PicturePreview from "../../../components/ui/picture-preview";
import Post from "../../../components/post/Post";
import InsightsDisplay from "../../../components/ui/insightsDisplay";
//HOOKS
import useAlert from "../../../hooks/useAlert";
import useUploadAvatar from "../../../hooks/db/useUploadAvatar";
import useClickOutside from "../../../hooks/useClickOutside";
//HELPERS
import getAvatarUrl from "../../../utils/getAvatarUrl";
import deleteAvatar from "../../../utils/deleteAvatar";
import getUser from "../../../utils/getUser";
//REACT AND OTHER
import { useNavigate, Link, useParams } from "react-router-dom";
import supabase from "../../../lib/supabase";
import { useEffect, useState, Activity, useRef } from "react";
import { useStoreState, useStoreActions } from "easy-peasy";

function MyProfilePage() {
  const [user, setUser] = useState(null);
  const [signedInUser, setSignedInUser] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showAvatarMenu, setShowAvatarMenu] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [posts, setPosts] = useState([]);
  const [postsLoading, setPostsLoading] = useState(false);
  const [profileNotFound, setProfileNotFound] = useState(false);

  const showPicturePreview = useStoreState((state) => state.showPicturePreview);
  const setShowPicturePreview = useStoreActions(
    (actions) => actions.setShowPicturePreview,
  );
  const setOverlayOn = useStoreActions((actions) => actions.setOverlayOn);

  const imgMenuRef = useRef();

  const navigate = useNavigate();

  const alert = useAlert();

  const { username: routeUsername } = useParams();

  const isOwner = signedInUser?.id === user?.id;

  useClickOutside(imgMenuRef, () => setShowAvatarMenu(false));

  const uploadAvatar = useUploadAvatar();

  useEffect(() => {
    let isMounted = true;

    const loadProfileData = async () => {
      setLoading(true);
      setPostsLoading(true);
      setError("");

      try {
        const { data: authData, error: authError } =
          await supabase.auth.getUser();

        if (authError) throw authError;

        if (isMounted) {
          setSignedInUser(authData.user);
        }

        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("username", routeUsername)
          .maybeSingle();

        if (profileError) throw profileError;

        if (!profileData) {
          if (isMounted) {
            setUser(null);
            setPosts([]);
            setError("User not found Please try refreshing the page");
            setProfileNotFound(true);
          }
          return;
        }

        if (isMounted) {
          setUser(profileData);
        }

        const { data: profilePosts, error: postsError } = await supabase
          .from("blogs")
          .select(
            `
            * ,
            profiles (username, email, full_name, avatar),
            likes (id),
            comments (id)
          `,
          )
          .eq("user_id", profileData.id)
          .order("created_at", { ascending: false })
          .order("id", { ascending: false });

        if (postsError) throw postsError;

        if (isMounted) {
          setPosts(profilePosts ?? []);
        }
      } catch (err) {
        if (isMounted) {
          setError(
            err.message + "Please try refreshing the page" ||
              "Could not load profile Please try refreshing the page",
          );
          console.error(err);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
          setPostsLoading(false);
        }
      }
    };

    if (routeUsername) {
      loadProfileData();
    } else {
      setUser(null);
      setPosts([]);
      setLoading(false);
      setPostsLoading(false);
    }

    return () => {
      isMounted = false;
    };
  }, [routeUsername]);

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];

    if (!file) return;

    setUploadLoading(true);
    try {
      alert("success", "Uploading...", true);
      const newPath = await uploadAvatar(file, user, alert);

      if (newPath) {
        setUser((prev) => ({
          ...prev,
          avatar: newPath,
        }));
      }
      setShowAvatarMenu(false);
    } catch (err) {
      alert("err", err, true);
      console.log(err);
    } finally {
      setUploadLoading(false);
    }
  };

  const handleDeleteAvatar = async () => {
    setDeleteLoading(true);

    try {
      const currentUser = await getUser();
      deleteAvatar(currentUser.id, alert);
      setShowAvatarMenu(false);
      alert("success", "Deleting...", true);

      setUser((prev) => ({
        ...prev,
        avatar: null,
      }));
    } catch (err) {
      console.error(err);
      alert("err", err, true);
    } finally {
      setDeleteLoading(false);
    }
  };

  const handlePostDeleted = (postId) => {
    setPosts((prevPosts) => prevPosts.filter((post) => post.id !== postId));
  };

  if (loading) return <Loader />;
  return (
     profileNotFound ? 
         
         <section className="user-not-found-section">
          <figure className="user-not-found-profile-preview">
                <img
                  width={"100px"}
                  height={"100px"}
                  onClick={() => {
                    setOverlayOn(true);
                    setShowPicturePreview(true);
                  }}
                  src={getAvatarUrl(user?.avatar)}
                  alt=""
                />
              </figure>
          <div className="user-not-found-feedback-container">
              <p>User Not Found</p>
    
              <p>
                  
                  <AlertIcon width={"50px"} height={"50px"} color={'var(--primary)'} />
    
                Looks like there might be a usename typo in the url, try double checking your username</p>
          </div>
          </section>
        
    
        :
    <section className="profile-main">
      <Activity mode={showPicturePreview ? "visible" : "hidden"}>
        <PicturePreview src={getAvatarUrl(user?.avatar)} />
      </Activity>

      <Activity mode={error ? "visible" : "hidden"}>
        <p
          style={{
            fontSize: "2rem",
            textAlign: "center",
            color: "red",
          }}
        >
          {error}
        </p>
      </Activity>

      <Notify type={"success"} message={"Success Message"} />

      <section className="infoSection">
        <div className="upper-container">
          <figure>
            <img
              onClick={() => {
                setOverlayOn(true);
                setShowPicturePreview(true);
              }}
              src={getAvatarUrl(user?.avatar)}
              alt=""
            />
          </figure>

          {isOwner ?
            <>
              <span
                onMouseDown={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.stopPropagation();
                  setShowAvatarMenu((prev) => !prev);
                }}
                className="edit-profile-img-icon"
              >
                <Edit height={"25px"} width={"25px"} color={`var(--primary)`} />
              </span>

              <div
                ref={imgMenuRef}
                className={showAvatarMenu ? "img-menu show" : "img-menu"}
              >
                <ul>
                  <li
                    role="button"
                    className={uploadLoading ? "isDisabled" : ""}
                  >
                    <label className="profile-img-label" htmlFor="profile-img">
                      <ImgIcon
                        height={"20px"}
                        width={"20px"}
                        color={`var(--text)`}
                      />
                      {uploadLoading ? "Uploading..." : "Choose new picture"}
                    </label>
                    <input
                      onChange={(e) => handleAvatarChange(e)}
                      className="profile-img-input"
                      type="file"
                      accept="image/*"
                      id="profile-img"
                    />
                  </li>
                  <li
                    role="button"
                    onClick={() => {
                      if (!user?.avatar) return;
                      handleDeleteAvatar();
                    }}
                    className={!user?.avatar ? "isDisabled" : ""}
                  >
                    {" "}
                    <DeleteIcon
                      height={"20px"}
                      width={"20px"}
                      color={`var(--text)`}
                    />{" "}
                    {deleteLoading ? "Deleting..." : "Delete current picture"}
                  </li>
                </ul>
              </div>
            </>
          : null}
        </div>
        <div className="nameNUsernameContainer">
          <p className="fullname">{user?.full_name ?? "Undefined"}</p>
          <p className="username">{`@${user?.username}` ?? "Undefined"}</p>
        </div>
        <div className="descriptionContainer">
          <p className="descriptionText">
            {user?.bio ?
              user.bio
            : isOwner ?
              <Link to="/app/settings">Add Bio</Link>
            : "No bio yet"}
          </p>
        </div>

        <InsightsDisplay />

        <Activity mode={isOwner ? "visible" : "hidden"}>
          <button
            className="editProfileBtn"
            onClick={() => {
              navigate("/app/settings");
            }}
          >
            <Edit height={"25px"} width={"25px"} color={"white"} /> Edit Profile
          </button>
          <Link className="editProfileBtn" to={"/app/write"}>
            <Add height={"25px"} width={"25px"} color={"white"} /> New Post
          </Link>
        </Activity>
      </section>

      <section className="recentStoriesSection">
        <h3>Recent Stories</h3>

        {postsLoading && !posts.length ?
          <p>Loading posts...</p>
        : !posts || !posts.length ?
          <p>No posts yet</p>
        : <div className="postsContainer">
            {posts.map((post) => (
              <Post
                post={post}
                key={post.id}
                showActions={isOwner ? true : false}
                onDeleteSuccess={handlePostDeleted}
              />
            ))}
          </div>
        }
      </section>
    </section>
  );
}

export default MyProfilePage;
