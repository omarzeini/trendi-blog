import "./SearchResult.css";
import { useStoreState } from "easy-peasy";
import Post from "../../components/post/Post";
import styled from "styled-components";
import { useNavigate } from "react-router-dom";

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

const SearchResult = () => {
  const searchResults = useStoreState((state) => state.searchResults);
  const searchQuery = useStoreState((state) => state.searchQuery);

  const navigate = useNavigate();

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
    <div className="resultsContainer">
      {!searchResults.length ?
        <p className="defaultText" style={{ margin: "2rem" }}>
          {searchQuery?.trim() ?
            `No matching results for "${searchQuery}"`
          : "Type to see results here"}
        </p>
      : <>
          <h2
            style={{
              marginLeft: "1rem",
              marginTop: "1rem",
              marginBottom: "1rem",
              fontSize: "1.8rem",
              fontWeight: "700",
              color: `var(--text)`,
            }}
            className="resultsHeader"
          >
            Search Resutls
          </h2>

          <PostsContainer>
            {searchResults.map((post) => (
              <div
                style={{ cursor: "pointer" }}
                key={post.id}
                onClick={() => {
                  navigate(`/app/post/${slugify(post.title)}${-post.id}`);
                }}
              >
                <Post post={post} key={post.id} />
              </div>
            ))}
          </PostsContainer>
        </>
      }
    </div>
  );
};

export default SearchResult;
