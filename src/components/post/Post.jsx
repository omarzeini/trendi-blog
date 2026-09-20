import "./Post.css";
//ICONS
import Comment from "../../icons/Comment";
import Heart from "../../icons/Heart";
import GlobalBookmark from "../../icons/global-bookmark";
import FilledBookmark from "../../icons/filled-global-bookmark";
import Edit from "../../icons/Edit";
import Delete from "../../icons/delete-icon";
import Eye from "../../icons/Eye";

import { useStoreState, useStoreActions } from "easy-peasy";
import getAvatarUrl from "../../utils/getAvatarUrl";
import profilePlaceholder from "../../images/profile-placeholder.png";
import React, { Activity, useState } from "react";
import "react-time-ago/locale/en";
import ReactTimeAgo from "react-time-ago";
import styled from "styled-components";
import ReactMarkdown from "react-markdown";
import { useNavigate } from "react-router-dom";
import ConfirmationModel from "../ui/confirmationModel";
import useBlogActions from "../../hooks/db/useBlogActions";
import useAlert from "../../hooks/useAlert";
import useWindowSize from "../../hooks/useWindowSize";

const Post = React.forwardRef(
  (
    {
      isMD = true,
      variant = "full",
      post,
      showActions = false,
      onDeleteSuccess,
      blogViews 
    },
    ref,
  ) => {
    const bookmarked = useStoreState((state) => state.bookmarks.bookmarked);
    const setOverlayOn = useStoreActions((actions) => actions.setOverlayOn);
    const [showModel, setShowModel] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const { width } = useWindowSize();

    const isBookmarked = bookmarked.some((item) => item.id === post.id);

    const likeCount = Array.isArray(post?.likes) ? post.likes.length : 0;

    const commentCount =
      Array.isArray(post?.comments) ? post.comments.length : 0;

    const { deleteBlog } = useBlogActions();

    const navigate = useNavigate();
    const Alert = useAlert();

    const slugify = (text) =>
      text
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)+/g, "");

    if (!post || post === null) {
      return (
        <p
          style={{
            textAlign: "center",
            fontSize: "1.2rem",
            width: "80%",
            marginBlock: "1rem",
            marginInline: "auto",
          }}
        >
          Loading... <br /> If posts don't load shortly try refreshing the page.
        </p>
      );
    }

    return (
      // <p>Hello world</p>
      <>
        <div ref={ref} className={`postContainer ${variant}--postContainer`}>
          <Activity mode={showActions ? "visible" : "hidden"}>
            <ActionButtons>
              <ActionButton $isPointer={false}>
                  {/* <Eye width={"15px"} height={"15px"} color={"white"} /> */}
                  views : {blogViews || 0}
              </ActionButton>
              <ActionButton $isPointer={true}
                onClick={() => {
                  navigate(`/app/write/${post.id}`);
                }}
              >
                {" "}
                <Edit width={"15px"} height={"15px"} color={"white"} /> Edit
              </ActionButton>

              <ActionButton $isPointer={true}
                onClick={() => {
                  setOverlayOn(true);
                  setShowModel(true);
                }}
              >
                {" "}
                <Delete width={"15px"} height={"15px"} color={"white"} /> Delete
              </ActionButton>
            </ActionButtons>
          </Activity>

          <Activity mode={showModel ? "visible" : "hidden"}>
            <ConfirmationModel
              title={"Delete this Post"}
              subTitle={"Are you sure you wanna delete this post forever ?"}
              actionText={deleting ? "Deleting..." : "Delete"}
              onAction={async () => {
                setDeleting(true);
                try {
                  await deleteBlog(post.id);
                  setShowModel(false);
                  setOverlayOn(false);
                  onDeleteSuccess?.(post.id);
                  Alert("success", "Post deleted.", true);
                } catch (err) {
                  Alert("err", err, true);
                  console.log(err);
                } finally {
                  setDeleting(false);
                }
              }}
              onCancel={() => {
                setShowModel(false);
                setOverlayOn(false);
              }}
            />
          </Activity>

          {post.image_url && (
            <figure className="imageFigure">
              <img
                className="post-image"
                height={"100px"}
                width={"100px"}
                src={post.image_url}
                alt=""
                loading="lazy"
              />
            </figure>
          )}

          <div
            style={{
              cursor: "pointer",
            }}
            onClick={() => {
              if(!isMD) {
                return;
              }else {
                navigate(`/app/post/${slugify(post.title)}-${post.id}`);
              }
              
            }}
          >
            <div className="textContainer">
              <p dir="auto" className="title">
                {post.title}
              </p>

              <article dir="auto" className="bodyAbbreviation">
                {isMD ?
                  <ReactMarkdown>
                    {post.body.slice(0, 60) + "..."}
                  </ReactMarkdown>
                : post.body.slice(0, 60) + "..."}
              </article>

              <div className="detailsContainer">
                <p className="category--date">
                  <span dir="auto" className="category">
                    {post.category}
                  </span>{" "}
                  &bull;{" "}
                  <span className="date">
                    <ReactTimeAgo date={post.created_at} locale="en" />{" "}
                  </span>
                </p>
              </div>
            </div>

            <div id="bottomContainer">
              <div className="userContainer">
                <figure className="profileImgFigure">
                  <img
                    loading="lazy"
                    src={
                      post?.profiles?.avatar ?
                        getAvatarUrl(post.profiles.avatar)
                      : profilePlaceholder
                    }
                    alt=""
                  />
                </figure>

                <div className="nameNUsernameContainer">
                  <p className="name">
                    {width <= 500 && post.profiles.full_name.length >= 10 ?
                      post.profiles.full_name.slice(0, 10) + "..."
                    : post.profiles.full_name}
                  </p>
                  <p className="username">{post.profiles.username}</p>
                </div>
              </div>

              <div className="intractionContainer">
                <span className="likes">
                  <Heart
                    width={variant === "full" ? "25px" : "10"}
                    height={variant === "full" ? "25px" : "10"}
                    color={"black"}
                  />
                  {likeCount}
                </span>

                <span className="comments">
                  <Comment
                    width={variant === "full" ? "25px" : "10"}
                    height={variant === "full" ? "25px" : "10"}
                    color={"black"}
                  />
                  {commentCount}
                </span>

                <span className="bookmark">
                  {isBookmarked ?
                    <FilledBookmark
                      width={variant === "full" ? "25px" : "10"}
                      height={variant === "full" ? "25px" : "10"}
                      color={`var(--primary)`}
                    />
                  : <GlobalBookmark
                      width={variant === "full" ? "25px" : "10"}
                      height={variant === "full" ? "25px" : "10"}
                      color={`var(--primary)`}
                    />
                  }
                </span>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  },
);

export default Post;

const ActionButtons = styled.div`
  position: absolute;
  top: 10px;
  right: 5px;
  display: flex;
  flex-direction: row;
  z-index: 100;
  gap: 10px;
`;

const ActionButton = styled.button`
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  gap: 5px;
  font-size: 0.9rem;
  background-color: var(--primary);
  border: none;
  color: white;
  padding: 10px;
  padding-block: 5px;
  border-radius: 8px;
  cursor: ${({$isPointer}) => $isPointer ? "pointer" : "auto" };
`;
