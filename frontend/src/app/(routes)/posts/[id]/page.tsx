import { getSinglePostData } from "@/actions";
import SinglePostContent from "@/components/SinglePostContent";
import { notFound } from "next/navigation";

export default async function SinglePostPage({ params }: { params: { id: string } }) {
  try {
    const {
      post, authorProfile, comments,
      commentsAuthors, myLike, myBookmark,
    } = await getSinglePostData(params.id);

    return (
      <SinglePostContent
        post={post}
        authorProfile={authorProfile}
        comments={comments}
        commentsAuthors={commentsAuthors}
        myLike={myLike}
        myBookmark={myBookmark}
      />
    );
  } catch {
    notFound();
  }
}