import mapex from "./index";

const data = {
  id: "123",
  author: {
    id: "1",
    name: "Paul",
  },
  title: "My awesome blog post",
  comments: [
    {
      id: "324",
      commenter: {
        id: "2",
        name: "Nicole",
      },
    },
  ],
};
const output = mapex(
  {
    $result: "article",
    user: {
      $name: "users",
    },
    comment: {
      $name: "comments",
      commenter: "user",
    },
    article: {
      $name: "articles",
      author: "user",
      comments: "comment",
    },
  },
  data
);

console.log(output.$result);
