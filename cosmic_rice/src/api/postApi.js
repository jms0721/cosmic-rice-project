export const savePost = async (postData) => {
  const response = await fetch("http://localhost:3000/api/posts", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(postData)
  });
  console.log("Firebase 저장 성공");
  return response.json();
};

export const getPosts = async () => {
  const response = await fetch("http://localhost:3000/api/posts");

  return response.json();
};