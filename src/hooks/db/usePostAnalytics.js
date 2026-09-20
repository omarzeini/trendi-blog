import { useEffect, useRef } from "react";
import supabase from "../../lib/supabase";
import useAlert from "../useAlert";

const usePostAnalytics = (blogId, user) => {
  const hasReadBeenSent = useRef(false);
  const hasViewBeenSent = useRef(false);
  const startTime = useRef(Date.now());
  const showToast = useAlert();

  useEffect(() => {
    if (!blogId || hasViewBeenSent.current) return;

    hasViewBeenSent.current = true;

    const insertView = async () => {
      try {
        const { data: blog, error: authorErr } = await supabase
          .from("blogs")
          .select("user_id, blog_views")
          .eq("id", blogId)
          .single();

        if (authorErr) {
          console.log("Network or Server Error", authorErr);
          showToast(
            "err",
            "Something went wrong, Please refresh the page",
            true,
          );
          return;
        }

        if (user?.id === blog.user_id) {
          return;
        }

        const { error: viewError } = await supabase
          .from("blog_views")
          .insert({
            blog_id: blogId,
            user_id: user?.id || null,
          })
          .select();

        if (viewError) {
          console.error("Error inserting blog view:", viewError);
          return;
        }

        // console.log(
        //   "view should be registered",
        //   data,
        //   "blog id:",
        //   blogId,
        //   "user id : ",
        //   user?.id,
        // );
      } catch (err) {
        console.error("Unexpected error inserting blog view:", err);
      }
    };

    insertView();
  }, [blogId, user?.id]);

  useEffect(() => {
    if (!blogId || hasReadBeenSent.current) return;

    const checkReadConditions = async () => {
      const { data: blog, error: authorErr } = await supabase
        .from("blogs")
        .select("user_id")
        .eq("id", blogId)
        .single();

      if (authorErr) {
        console.log("Network or Server Error", authorErr);
        showToast("err", "Something went wrong, Please refresh the page", true);
        return;
      }

      if (user?.id === blog.user_id) {
        return;
      }

      if (hasReadBeenSent.current) return;

      const timeSpent = (Date.now() - startTime.current) / 1000;

      const scrollPercentage =
        (window.scrollY + window.innerHeight) /
        document.documentElement.scrollHeight;

      const hasEnoughTime = timeSpent >= 20;

      const hasEnoughScroll = scrollPercentage >= 0.7;

      if (hasEnoughTime && hasEnoughScroll) {
        hasReadBeenSent.current = true;

        await supabase.from("blog_reads").insert({
          blog_id: blogId,
          user_id: user?.id || null,
        });

        window.removeEventListener("scroll", onScroll);
      }
    };

    const onScroll = () => {
      checkReadConditions();
    };

    const timer = setInterval(checkReadConditions, 1000);

    window.addEventListener("scroll", onScroll);

    return () => {
      clearInterval(timer);

      window.removeEventListener("scroll", onScroll);
    };
  }, [blogId, user?.id]);
};

export default usePostAnalytics;
