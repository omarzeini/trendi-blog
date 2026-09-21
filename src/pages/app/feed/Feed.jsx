import styled from "styled-components";
import Post from "../../../components/post/Post";
import { Link } from "react-router-dom";
import useFeed from "../../../hooks/db/useFeed";
import { useCallback, useRef } from "react";
import Loader from "../../../components/ui/loader";
import { useStoreState } from "easy-peasy";
import RightArrow from "../../../icons/RightArrow";

const StyledMain = styled.main`
  display: flex;
  justify-content: start;
  align-items: flex-start;
  flex-direction: column;
  width: 100%;
  min-height: 100vh;
  gap: 15px;

  .latestUpdates {
    margin-left: 1rem;
    margin-top: 1rem;
    margin-bottom: 1rem;
    font-size: 1.8rem;
    font-weight: 700;
    color: var(--text);
  }
`;

const PostsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 40px;
  justify-content: center;
  align-items: center;
  width: 100%;
  padding-block: 30px;

  @media (max-width: 768px) {
    padding-top: 10px;
  }
`;

const Feed = () => {
  const { loading, blogs, fetchBlogs, hasMore } = useFeed();
  const errorFetchingBlogs = useStoreState((s) => s.errorFetchingBlogs);

  const observer = useRef();

  const lastPostRef = useCallback(
    (node) => {
      if (loading) return;

      if (observer.current) {
        observer.current.disconnect();
      }

      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMore) {
          fetchBlogs();
          //console.log("reaching the last post");
        }
      });

      if (node) {
        observer.current.observe(node);
      }
    },
    [loading, fetchBlogs, hasMore],
  );

  //const posts = useStoreState((state) => state.posts);

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

  return (
    <StyledMain>
      <h2 className="latestUpdates">Latest Updates</h2>
      <PostsContainer>
        {loading && !blogs.length ?
          <Loader />
        : errorFetchingBlogs ?
          <>
            <p style={{ width: "80%", marginLeft: "1rem", fontSize: "1.1rem" }}>
              Error getting blogs, Please check your internet connection and{" "}
              <span
                style={{
                  fontWeight: "500",
                  color: "var(--primary)",
                  cursor: "pointer",
                }}
                onClick={fetchBlogs}
              >
                try again
              </span>{" "}
            </p>
          </>
        : !loading && !blogs.length ?
          <>
            <NoBlogs
              style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                padding: "10px",
                fontSize: "1.5rem",
              }}
            >
              <p>No Blogs found now </p>
              <span style={{ marginLeft: "1rem", display: "block" }}>
                <Link
                  style={{ color: "var(--primary)", fontWeight: "500" }}
                  to={"/app/write"}
                >
                  {" "}
                  Write a blog{" "}
                  <RightArrow
                    height="20px"
                    width="20px"
                    color="var(--primary)"
                  />{" "}
                </Link>{" "}
              </span>
            </NoBlogs>
          </>
        : blogs.map((post, index) => (
            <Link
              to={`/app/post/${slugify(post.title)}-${post.id}`}
              key={post.id}
            >
              <Post
                post={post}
                key={post.id}
                ref={index === blogs.length - 1 ? lastPostRef : null}
              />
            </Link>
          ))
        }
      </PostsContainer>
    </StyledMain>
  );
};

export default Feed;

const NoBlogs = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: row;
  font-size: 1.5rem;
  gap: 1rem;

  @media (max-width: 500px) {
    flex-direction: column;
  }
`;
