// files
import "./PostPage.css";
//icons
import Comment from "../../../icons/Comment";
import Heart from "../../../icons/Heart";
import Share from "../../../icons/Share";
import GlobalBookmark from "../../../icons/global-bookmark";
import FilledBookmark from "../../../icons/filled-global-bookmark";
import profilePlaceholder from "../../../images/profile-placeholder.png";
import More from "../../../icons/more";
//  OTHER
import { useEffect, useState, useCallback, Activity, useRef } from "react";
import { useStoreState, useStoreActions } from "easy-peasy";
import { useParams, Link, useNavigate } from "react-router-dom";
import supabase from "../../../lib/supabase";
import ReactTimeAgo from "react-time-ago";
import "react-time-ago/locale/en";
import getAvatarUrl from "../../../utils/getAvatarUrl";
import styled from "styled-components";
import ReactMarkdown from "react-markdown";
import remarkBreaks from "remark-breaks";
import getPostDescription from "../../../utils/getPostDescription";

//COMPONENTS
import Loader from "../../../components/ui/loader";
import ConfirmationModel from "../../../components/ui/confirmationModel";

//HOOKS
import useLikes from "../../../hooks/db/useLikes";
import useAlert from "../../../hooks/useAlert";
import getUser from "../../../utils/getUser";
import usePostAnalytics from "../../../hooks/db/usePostAnalytics";
import useClickOutside from "../../../hooks/useClickOutside";
import SEO from "../../../components/SEO/SEO"

const PostPage = () => {
  // const [heartColor, setHeartColor] = useState(false);
  const [comment, setComment] = useState("");
  const [editCommentValue, setEditCommentValue] = useState("");
  const [oldComment, setOldComment] = useState("");
  const [isUpdateButtonDisabled, setIsUpdateButtonDisabled] = useState(true);
  const [isEditComment, setIsEditComment] = useState(false);
  const [loadingUpdatedComment, setLoadingUpdatedComment] = useState(false);
  const [editCommentId, setEditCommentId] = useState(null);
  const [post, setPost] = useState(null);
  const [blogId, setBlogId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [author, setAuthor] = useState(undefined);
  const [user, setUser] = useState(null);
  const [comments, setComments] = useState([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [addingComment, setAddingComment] = useState(false);
  const [showCommentActions, setShowCommentActions] = useState(null);
  const [showDeleteModel, setShowDeleteModel] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editCommentFocus, setEditCommentFocus] = useState(false);

  const setOverlayOn = useStoreActions((actions) => actions.setOverlayOn);
  const setShowSignInModel = useStoreActions(
    (actions) => actions.setShowSignInModel,
  );
  const isGuest = useStoreState((state) => state.guest.isGuest);

  const commentActionsRef = useRef();
  const commentTextareaRef = useRef();

  useEffect(() => {
    if (!commentTextareaRef.current) {
      return;
    } else {
      if (editCommentFocus) {
        commentTextareaRef.current.focus();
        const textLength = commentTextareaRef.current.value.length;
        commentTextareaRef.current.setSelectionRange(textLength, textLength);
      } else {
        commentTextareaRef.current.blur();
      }
    }
  }, [editCommentFocus]);

  useEffect(() => {
    if (oldComment === editCommentValue || loadingUpdatedComment) {
      setIsUpdateButtonDisabled(true);
    } else {
      setIsUpdateButtonDisabled(false);
    }
  }, [editCommentValue, isEditComment, loadingUpdatedComment, oldComment]);

  const Alert = useAlert();

  const navigate = useNavigate();

  useEffect(() => {
    const getAndSetUser = async () => {
      const fetchUser = await getUser();
      setUser(fetchUser);
    };

    getAndSetUser();
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const bookmarked = useStoreState((state) => state.bookmarks.bookmarked);
  const toggleBookmark = useStoreActions(
    (actions) => actions.bookmarks.toggleBookmark,
  );

  //const posts = useStoreState((state) => state.posts);

  //const id = Number(useParams().id);

  const { id: slugWithId } = useParams();

  const slugParts = slugWithId.split("-");
  const postId = slugParts[slugParts.length - 1];

  useEffect(() => {
    const getPost = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from("blogs")
          .select(`*, likes(id), profiles(*)`)
          .eq("id", postId)
          .single();

        const { data: author, authorErr } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", data.user_id)
          .single();

        if (error || authorErr) {
          console.log(
            "error getting post or author:",
            error.message || authorErr,
          );
          return;
        }
        setPost(data);
        setBlogId(data.id);
        setAuthor(author);
      } catch (err) {
        console.log(err);
      } finally {
        setLoading(false);
      }
    };

    getPost();
  }, [slugWithId, postId]);

  const { liked, likesCount, toggleLike } = useLikes(blogId, user ?? null);

  const fetchComments = useCallback(async () => {
    if (!blogId) return;

    try {
      setCommentsLoading(true);

      const { data, error } = await supabase
        .from("comments")
        .select(
          `*,
          profiles (
            username,
            avatar
          )
        `,
        )
        .eq("blog_id", blogId)
        .order("created_at", { ascending: true });

      if (error) throw error;

      setComments(data || []);
    } catch (err) {
      console.log("ERROR FETCHING COMMENTS :", err);
      Alert("err", err.message || err, true);
    } finally {
      setCommentsLoading(false);
    }
  }, [blogId, Alert]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const addComment = async (content) => {
    if (!user || !content.trim() || !blogId) return;

    const { error } = await supabase.from("comments").insert({
      blog_id: blogId,
      user_id: user.id,
      content: content.trim(),
    });

    if (error) {
      console.log("Error commenting:", error);
      Alert("err", error.message || error, true);
      return;
    }

    await fetchComments();
  };

  const isBookmarked = bookmarked.some((item) => item?.id === post?.id);

  const handleInvalid = (e) => {
    e.target.setCustomValidity("But what's your  comment ?.");
  };

  const handleInput = (e) => {
    e.target.setCustomValidity("But what's your comment?");
  };

  usePostAnalytics(post?.id, user ?? null);

  useClickOutside(commentActionsRef, () => {
    setShowCommentActions(null);
  });

  const updateComment = async (commentId, update) => {
    if (!commentId || !user?.id) {
      Alert("err", "Unable to update comment right now.", true);
      return;
    }

    const trimmedUpdate = update?.trim();

    if (!trimmedUpdate) {
      Alert("err", "Comment cannot be empty.", true);
      return;
    }

    try {
      setLoadingUpdatedComment(true);
      const { data, error } = await supabase
        .from("comments")
        .update({ content: trimmedUpdate })
        .eq("id", commentId)
        .eq("user_id", user?.id)
        .select();

      if (error) {
        Alert("err", `Error updating comment: ${error.message || error}`, true);
        console.log(error);
        return;
      }

      if (data?.[0]) {
        setComments((prevComments) =>
          prevComments.map((commentItem) =>
            commentItem.id === commentId ?
              { ...commentItem, content: trimmedUpdate }
            : commentItem,
          ),
        );
      }

      setIsEditComment(false);
      setEditCommentId(null);
      setEditCommentValue("");
      Alert("success", "Comment updated successfully", true);
      await fetchComments();
    } catch (err) {
      console.error("Error updating comment:", err.message || err);
      Alert("err", `Error updating comment: ${err.message || err}`, true);
    } finally {
      setLoadingUpdatedComment(false);
    }
  };

  const onUpdate = async (id, content) => {
    try {
      await updateComment(id, content);
    } catch (err) {
      console.log("error updating comment", err);
    }
  };

  const deleteComment = async (commentId) => {
    if (!commentId || !user) return;

    try {
      setIsDeleting(true);
      const { error } = await supabase
        .from("comments")
        .delete()
        .eq("id", commentId)
        .eq("user_id", user?.id);
      if (error) {
        Alert("err", "Error Deleting Comment:", error.message || error, true);
        console.log("Error Deleting Comment:", error.message);
        return;
      }

      Alert("success", "Comment deleted", true);
      setComments((prev) => prev.filter((comment) => comment.id !== commentId));
      setOverlayOn(false);
      setShowDeleteModel(false);
    } catch (err) {
      Alert("err", "Error Deleting Comment:", err.message || err, true);
      console.log("Error Deleting Comment:", err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  // const slugify = (text) =>
  //   text
  //     .toLowerCase()
  //     .replace(/[^a-z0-9]+/g, "-")
  //     .replace(/(^-|-$)+/g, "");
    
  const slugify = (text) =>
  text
    .toLowerCase()
    .trim()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "");
   

  if (loading) return <Loader />;
  if (!post || !author)
    return (
      <p>
        Ops post not found !{" "}
        <Link style={{ color: `var(--primary)` }} to="/app/feed">
          {" "}
          Go back{" "}
        </Link>
      </p>
    );

     const slug =`${slugify(post?.title)}-${post?.id}`

    

  return (
    <>
    <SEO title={post?.title} description={getPostDescription(post?.body)} url={`/app/post/${slug}`} image={post?.image_url} type="article" />
    <section className="postPageSection">
      <div className="content-section">
        {post.image_url && (
          <figure className="postImgFigure">
            <img src={post.image_url} alt="" />
          </figure>
        )}

        <h3 dir="auto" id="post-page-title" className="title post-page-title">
          {post.title}
        </h3>

        <div className="categoryContainer">
          <span dir="auto" className="category">
            {post.category}
          </span>{" "}
          <span className="bullet">&bull;</span>{" "}
          <span className="date">
            {" "}
            <ReactTimeAgo date={post.created_at} locale="en" />{" "}
          </span>
        </div>

        <div className="userContainer">
          <Link to={`/app/profile/${author?.username}`}>
            <figure className="profileImgFigure">
              <img
                src={
                  author?.avatar ?
                    getAvatarUrl(author.avatar)
                  : profilePlaceholder
                }
                alt=""
              />
            </figure>
          </Link>

          <div className="nameNUsernameContainer">
            <Link to={`/app/profile/${author?.username}`}>
              <p className="name">{author.full_name}</p>{" "}
            </Link>
            <p className="username">@{author.username}</p>
          </div>
        </div>

        <hr />

        <article dir="auto" className="postContent">
          <ReactMarkdown remarkPlugins={[remarkBreaks]}>
            {post.body}
          </ReactMarkdown>
        </article>

        <div className="commentsAndLikesContainer">
          <h2>Comments ({comments ? comments.length : 0})</h2>

          <div className="iconsContainer">
            <span
              style={{
                display: "flex",
                justifyContent: "center",
                gap: "5px",
              }}
              role="button"
              className="post-page-likes"
              onClick={() => {
                if (isGuest) {
                  setOverlayOn(true);
                  setShowSignInModel(true);
                  return;
                }
                toggleLike();
              }}
            >
              <Heart
                width={"25px"}
                height={"25px"}
                color={liked ? "#ff4d6d" : "none"}
              />
              {likesCount}
            </span>

            <span className="post-page-comments">
              <Comment width={"25px"} height={"25px"} color={"black"} />
              {comments ? comments.length : 0}
            </span>

            <span
              onClick={() => {
                if (isGuest) {
                  setOverlayOn(true);
                  setShowSignInModel(true);
                  return;
                }
                toggleBookmark(post);
              }}
              style={{
                cursor: "pointer",
              }}
              className="comments bookmark"
            >
              {isBookmarked ?
                <FilledBookmark
                  width="25px"
                  height="25px"
                  color={`var(--primary)`}
                />
              : <GlobalBookmark
                  width="25px"
                  height="25px"
                  color={`var(--primary)`}
                />
              }
            </span>
            {/* <span
            style={{
              cursor: "pointer",
            }}
            className="comments bookmark"
          >
            <GlobalBookmark width={"25px"} height={"25px"} color={"black"} />
          </span> */}
          </div>
        </div>

        <div className="commentsContainer">
          {commentsLoading && <p>Loading comments...</p>}
          {!comments || !comments.length ?
            <p>No comments yet, Be the first to comment!</p>
          : comments.map((comment) => (
              <div className="commentContainer" key={comment.id}>
                <figure className="CommentProfileImgFigure">
                  <Link to={`/app/profile/${comment.profiles.username}`}>
                    <img
                      src={
                        getAvatarUrl(comment.profiles.avatar) ||
                        profilePlaceholder
                      }
                      alt=""
                    />
                  </Link>
                </figure>

                <div className="nameAndCommentContainer">
                  <div className="nameAndDateContainer">
                    <p
                      onClick={() => {
                        navigate(`/app/profile/${comment?.profiles?.username}`);
                      }}
                      className="name"
                      style={{ cursor: "pointer" }}
                    >
                      {comment?.profiles?.username}
                    </p>
                    <p className="date">
                      <ReactTimeAgo date={comment?.created_at} local={"en"} />
                    </p>
                  </div>

                  <div className="commentAndMoreContainer">
                    {isEditComment && editCommentId === comment.id ?
                      <EditCommentContainer>
                        <textarea
                          dir="auto"
                          ref={commentTextareaRef}
                          type="text"
                          value={editCommentValue}
                          onChange={(e) => setEditCommentValue(e.target.value)}
                          disabled={loadingUpdatedComment}
                        ></textarea>
                        <div className="btnsContainer">
                          <button
                            onClick={() => {
                              setIsEditComment(false);
                              setEditCommentFocus(false);
                            }}
                            className="cancelEditBtn"
                          >
                            Cancel
                          </button>

                          <button
                            onClick={() => {
                              if (oldComment === editCommentValue) {
                                setIsUpdateButtonDisabled(true);
                                return;
                              }
                              onUpdate(comment.id, editCommentValue);
                            }}
                            disabled={isUpdateButtonDisabled}
                            className="updateCommentBtn"
                          >
                            {loadingUpdatedComment ? "Updating..." : "Update"}
                          </button>
                        </div>
                      </EditCommentContainer>
                    : <p dir="auto" className="commentContent">
                        {" "}
                        {comment.content}{" "}
                      </p>
                    }

                    {comment.user_id === user?.id && (
                      <div
                        onClick={() => {
                          setShowCommentActions((prev) =>
                            prev === null ? comment.id : null,
                          );
                        }}
                        style={{ cursor: "pointer" }}
                      >
                        <More
                          height={"20px"}
                          width={"20px"}
                          color={`var(--text)`}
                        />
                      </div>
                    )}

                    <Activity
                      mode={
                        showCommentActions === comment.id ? "visible" : "hidden"
                      }
                    >
                      <CommentActionsContainer ref={commentActionsRef}>
                        <li
                          role="button"
                          onClick={() => {
                            setEditCommentValue(comment.content);
                            setOldComment(comment.content);
                            setEditCommentId(comment.id);
                            setIsEditComment(true);
                            setShowCommentActions(null);
                            setEditCommentFocus(true);
                          }}
                        >
                          Edit
                        </li>
                        <li
                          role="button"
                          onClick={() => {
                            setOverlayOn(true);
                            setShowDeleteModel(true);
                          }}
                        >
                          Delete
                        </li>
                      </CommentActionsContainer>{" "}
                    </Activity>

                    <Activity mode={showDeleteModel ? "visible" : "hidden"}>
                      <ConfirmationModel
                        title={"Delete Comment"}
                        subTitle={"This can't be undone"}
                        actionText={isDeleting ? "Deleting" : "Delete"}
                        onAction={() => deleteComment(comment.id)}
                        onCancel={() => {
                          setOverlayOn(false);
                          setShowDeleteModel(false);
                        }}
                      />
                    </Activity>
                  </div>

                  {/* <span
                  className="commentHeart"
                  onClick={() => setHeartColor(!heartColor)}
                >
                  <Heart width={"20px"} height={"20px"} color={"red"} />
                  233
                </span> */}
                </div>
              </div>
            ))
          }
        </div>
      </div>

      <div className="commentFormContainer">
        <form className="commentForm" onSubmit={(e) => e.preventDefault()}>
          <input
            dir="auto"
            type="text"
            onInvalid={handleInvalid}
            onInput={handleInput}
            required
            name="comment"
            id="comment"
            placeholder="add a comment..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
          <button
            style={{
              opacity: comment ? 1 : 0.7,
              cursor: comment ? "pointer" : "not-allowed",
            }}
            disabled={comment && !addingComment ? false : true}
            onClick={() => {
              if (isGuest) {
                setOverlayOn(true);
                setShowSignInModel(true);
                return;
              }

              try {
                setAddingComment(true);
                addComment(comment);
                setComment("");
              } catch (err) {
                console.log(err);
                Alert("err", err, true);
              } finally {
                setAddingComment(false);
              }
            }}
          >
            <Share height={"25px"} width={"25px"} color={"white"} />
          </button>
        </form>
      </div>
    </section>
    </>
  );
};

export default PostPage;

const CommentActionsContainer = styled.ul`
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: start;
  width: 200px;
  border-radius: 10px;
  box-shadow: 0 0 2px black;
  gap: 0;
  background-color: var(--surface);
  padding: 5px;
  position: absolute;
  top: 20px;
  right: 0px;
  z-index: 200;

  & li {
    width: 100%;
    padding: 5px;
    border-radius: 8px;
    display: flex;
    justify-content: flex-start;
    align-items: start;
  }

  & li:hover {
    background-color: var(--border);
  }
`;

const EditCommentContainer = styled.div`
  width: 100%;
  display: flex;
  flex-direction: row;
  padding: 10px;
  gap: 10px;

  & textarea {
    width: 50%;
    padding: 5px;
    border-radius: 8px;
    border: 1px solid var(--border);
    color: var(--text);
    background-color: var(--surface);
    font-size: 0.9rem;

    &:focus {
      outline-color: var(--primary);
    }
  }

  & div.btnsContainer {
    display: flex;
    flex-direction: row;
    gap: 10px;
    justify-content: flex-end;
    align-items: center;
    width: 50%;
  }

  & button {
    display: grid;
    place-content: center;
    padding: 10px;
    cursor: pointer;
    border-radius: 8px;
    background-color: var(--bg);
    color: var(--text);
    border: 1px solid gray;
    min-width: 30%;
    height: 30px;
    font-size: 1rem;
  }

  & button.updateCommentBtn {
    background-color: var(--primary);
    color: white;
    border: none;
  }

  & button.updateCommentBtn:hover {
    font-weight: 500;
  }

  & button.updateCommentBtn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  & button.updateCommentBtn:disabled:hover {
    font-weight: 400;
  }

  & button.cancelEditBtn:hover {
    color: var(--err-color);
    border-color: var(--err-color);
    font-weight: 500;
  }

  @media (max-width: 768px) {
    flex-direction: column;
    & textarea {
      width: 100%;
    }

    & div.btnsContainer {
      width: 100%;
      justify-content: flex-end;
      align-items: center;
    }

    & button {
      width: 40%;
      font-size: 0.9rem;
    }
  }
`;
