import mapex from "./index";

test("1", () => {
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

  expect(output.$result).toEqual("123");
  expect(output).toEqual({
    articles: {
      123: {
        id: "123",
        author: "1",
        title: "My awesome blog post",
        comments: ["324"],
      },
    },
    users: {
      1: { id: "1", name: "Paul" },
      2: { id: "2", name: "Nicole" },
    },
    comments: {
      324: { id: "324", commenter: "2" },
    },
  });
});

test("union", () => {
  const data = [
    { type: "admin", id: 1 },
    { type: "guest", id: 2 },
  ];
  const output = mapex(
    {
      $result: "user",
      user: {
        $type: "type",
        admin: "admin",
        guest: "guest",
      },
      admin: {},
      guest: {},
    },
    data
  );

  expect(output.$result).toEqual([1, 2]);
  expect(output).toEqual({
    admin: { 1: { type: "admin", id: 1 } },
    guest: { 2: { type: "guest", id: 2 } },
  });
});

test("nested", () => {
  const data = {
    id: 1,
    childNodes: [{ id: 2 }, { id: 3, childNodes: [{ id: 4 }, { id: 5 }] }],
  };
  const output = mapex(
    {
      $result: "node",
      node: {
        childNodes: "node",
      },
    },
    data
  );
  expect(output.$result).toEqual(1);
  expect(output).toEqual({
    node: {
      1: {
        id: 1,
        childNodes: [2, 3],
      },
      2: {
        id: 2,
      },
      3: {
        id: 3,
        childNodes: [4, 5],
      },
      4: {
        id: 4,
      },
      5: {
        id: 5,
      },
    },
  });
});

test("omit", () => {
  const data = {
    id: 1,
    username: "admin",
    password: "abc",
  };

  const output = mapex(
    {
      $result: "user",
      user: {
        $id: false,
        password: false,
        username: true,
        extra: () => 100,
      },
    },
    data
  );

  expect(output.$result).toEqual({ id: 1, username: "admin", extra: 100 });
  expect(output).toEqual({});
});

test("values", () => {
  const data = { firstThing: { id: 1 }, secondThing: { id: 2 } };
  const output = mapex(
    {
      $result: "root",
      root: {
        $id: false,
        $value: "item",
      },
      item: {},
    },
    data
  );
  expect(output.$result).toEqual({ firstThing: 1, secondThing: 2 });
  expect(output).toEqual({
    item: { 1: { id: 1 }, 2: { id: 2 } },
  });
});

test("tree", () => {
  const data = [
    {
      id: 1,
      type: "drive",
      name: "C:/",
      children: [
        {
          id: 2,
          type: "folder",
          name: "Windows",
          children: [{ id: 3, type: "folder", name: "system32" }],
        },
        {
          id: 4,
          type: "file",
          name: "windows.bak",
        },
      ],
    },
    {
      id: 5,
      type: "drive",
      name: "D:/",
    },
  ];

  const output = mapex(
    {
      $result: "node",
      node: {
        $type: "type",
        $desc: true,
        file: "file",
        folder: "folder",
        drive: "drive",
      },
      _nodeBase: {
        children: "node",
      },
      folder: { $extend: "_nodeBase" },
      drive: { $extend: "_nodeBase" },
      file: { $extend: "_nodeBase" },
    },
    data
  );

  expect(output.$result).toEqual([1, 5]);
  expect(output).toEqual({
    node: {
      1: "drive",
      2: "folder",
      3: "folder",
      4: "file",
      5: "drive",
    },
    folder: {
      2: {
        id: 2,
        type: "folder",
        name: "Windows",
        children: [3],
      },
      3: {
        id: 3,
        type: "folder",
        name: "system32",
      },
    },
    drive: {
      1: {
        id: 1,
        type: "drive",
        name: "C:/",
        children: [2, 4],
      },
      5: {
        id: 5,
        type: "drive",
        name: "D:/",
      },
    },
    file: {
      4: {
        id: 4,
        type: "file",
        name: "windows.bak",
      },
    },
  });
});
