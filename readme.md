# mapex

Ultimate Javascript object mapping tool

## Installation

```
yarn add mapex
```

```
npm install mapex
```

## Quick Start

Consider a typical blog post. The API response for a single post might look something like this:

```json
{
  "id": "123",
  "author": {
    "id": "1",
    "name": "Paul"
  },
  "title": "My awesome blog post",
  "comments": [
    {
      "id": "324",
      "commenter": {
        "id": "2",
        "name": "Nicole"
      }
    }
  ]
}
```

We have two nested entity types within our article: users and comments. Using various schema, we can normalize all three entity types down:

```js
import mapex from "mapex";
mapex(
  {
    $result: "article",
    // define user schema
    user: {},
    // define comment schema
    comment: {
      // define commenter follows user schema
      commenter: "user",
    },
    // define article schema
    article: {
      author: "user",
      // define comments array follow comment schema
      comments: "comment",
    },
  },
  data
);
```

Now, normalizedData will be:

```jsx
const output = {
  $result: "123",
  article: {
    123: {
      id: "123",
      author: "1",
      title: "My awesome blog post",
      comments: ["324"],
    },
  },
  user: {
    1: { id: "1", name: "Paul" },
    2: { id: "2", name: "Nicole" },
  },
  comment: {
    324: { id: "324", commenter: "2" },
  },
};
```

## API

### mapex(schema, data)

### mapex(schema)

### Root schema attributes

```jsx
const schema = {
  // A name of schema that use to parse input data
  $result: "subSchema1",
  // A definition of sub schema
  subSchema1: {},
  subSchema2: {},
};
```

### Sub schema attributes

#### **\$name**

A prop name of entity collection in output object

```jsx
mapex(
  {
    $result: "article",
    article: {
      $name: "articles",
    },
  },
  {
    id: 1,
  }
);
```

Output

```json
{
  "$result": 1,
  "articles": { "id": 1 }
}
```

#### \$id

Indicate which entity property is id, \$id can be string or Function

```jsx
mapex(
  {
    $result: "article",
    article: {
      $id: "_id",
    },
  },
  {
    _id: 1,
  }
);
```

Output

```json
{
  "$result": 1,
  "article": { "_id": 1 }
}
```

#### \$value

Indicate entity property values follow the given schema.

```jsx
mapex(
  {
    $result: "item",
  },
  { firstThing: { id: 1 }, secondThing: { id: 2 } }
);
```

```json
{
  "$result": { "firstThing": 1, "secondThing": 2 },
  "item": { "1": { "id": 1 }, "2": { "id": 2 } }
}
```

#### \$type

Indicate the property which is schema name.

```jsx
mapex(
  {
    $result: "user",
    user: {
      $type: "roleId",
      1: "mod",
      2: "admin",
    },
    mod: {},
    admin: {},
  },
  [
    { id: 1, roleId: 1 },
    { id: 2, roleId: 2 },
    { id: 3, roleId: 1 },
  ]
);
```

```jsx
const output = {
  $result: [1, 2, 3],
  mod: {
    1: { id: 1, roleId: 1 },
    3: { id: 3, roleId: 1 },
  },
  admin: {
    2: { id: 2, roleId: 2 },
  },
  // no user collection generated
};
```

#### \$default

Use with **\$type** attribute, if entity does not present $type property, \$default schema will be used

```jsx
mapex(
  {
    $result: "user",
    user: {
      $type: "roleId",
      $default: "guest",
      1: "mod",
      2: "admin",
    },
    mod: {},
    admin: {},
    guest: {},
  },
  [
    { id: 1, roleId: 1 },
    { id: 2, roleId: 2 },
    { id: 3, roleId: 1 },
    // no roleId presents, this entity will follow 'guest' schema
    { id: 4 },
  ]
);
```

#### \$desc

Use with **\$type** attribute. if \$desc = true, a union entity collection will be added.

```jsx
mapex(
  {
    $result: "user",
    user: {
      $type: "roleId",
      $desc: true,
      1: "mod",
      2: "admin",
    },
    mod: {},
    admin: {},
  },
  [
    { id: 1, roleId: 1 },
    { id: 2, roleId: 2 },
    { id: 3, roleId: 1 },
  ]
);
```

```jsx
const output = {
  $result: [1, 2, 3],
  mod: {
    1: { id: 1, roleId: 1 },
    3: { id: 3, roleId: 1 },
  },
  admin: {
    2: { id: 2, roleId: 2 },
  },
  user: {
    1: "mod",
    3: "mod",
    2: "admin",
  },
};
```

If you want to customize user entity collection, just pass \$desc as a function.

```jsx
mapex(
  {
    $result: "user",
    user: {
      $type: "roleId",
      $desc(id, schema, entity) {
        return `${schema}_${id}`;
      },
      1: "mod",
      2: "admin",
    },
    mod: {},
    admin: {},
  },
  [
    { id: 1, roleId: 1 },
    { id: 2, roleId: 2 },
    { id: 3, roleId: 1 },
  ]
);
```

```jsx
const output = {
  $result: [1, 2, 3],
  mod: {
    1: { id: 1, roleId: 1 },
    3: { id: 3, roleId: 1 },
  },
  admin: {
    2: { id: 2, roleId: 2 },
  },
  user: {
    mod_1: "mod",
    mod_3: "mod",
    admin_2: "admin",
  },
};
```

#### \$process\(entity)

## Advanced usage

### Process tree nodes

```jsx
mapex(
  {
    $result: "node",
    node: {
      children: "node",
    },
  },
  {
    id: 1,
    name: "root",
    children: [
      {
        id: 2,
        name: "node 1",
        children: [
          { id: 4, name: "node 1.1" },
          { id: 5, name: "node 1.2" },
        ],
      },
      { id: 3, name: "node 2" },
    ],
  }
);
```

**Output**

```jsx
_ = {
  $result: 1,
  node: {
    1: { id: 1, name: "root", children: [2, 3] },
    2: { id: 2, name: "node 1", children: [4, 5] },
    3: { id: 3, name: "node 2" },
    4: { id: 4, name: "node 1.1" },
    5: { id: 5, name: "node 1.2" },
  },
};
```

## Dependencies

None.

```

```
