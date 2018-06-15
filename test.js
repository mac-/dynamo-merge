const test = require("tape")
const merge = require("./index")

test("SET", (t) => {
  t.plan(3)

  t.deepEqual(
    merge({ x: 42 }),
    {
      UpdateExpression: "SET #x = :x",
      ExpressionAttributeValues: { ':x': 42 },
      ExpressionAttributeNames: { '#x': 'x' }
    }
  )

  t.deepEqual(
    merge({ name: 'some name' }),
    {
      UpdateExpression: "SET #name = :name",
      ExpressionAttributeValues: { ':name': 'some name' },
      ExpressionAttributeNames: { '#name': 'name' }
    }
  )

  t.deepEqual(
    merge({ x: { y: "foo", z: { w: 42 } }, q: 0 }),
    {
      UpdateExpression: "SET #x.y = :x_y, #x.z.w = :x_z_w, #q = :q",
      ExpressionAttributeValues: { ":x_y": "foo", ":x_z_w": 42, ":q": 0 },
      ExpressionAttributeNames: { '#x': 'x', '#q': 'q' }
    }
  )
})

test("Combination", (t) => {
  t.plan(1)

  t.deepEqual(
    merge({ x: { y: [1, 2], z: "x" }, q: 10 }),
    {
      UpdateExpression: "SET #x.z = :x_z, #q = :q ADD #x.y :x_y0, #x.y :x_y1",
      ExpressionAttributeValues: { ":x_z": "x", ":q": 10, ":x_y0": 1, ":x_y1": 2 },
      ExpressionAttributeNames: { '#x': 'x', '#q': 'q' }
    }
  )
})


test("Functions", (t) => {
  t.plan(1)

  t.deepEqual(
    merge({ x: { y: () => "foo", z: "x" }, q: 10 }),
    {
      UpdateExpression: "SET #x.y = :x_y, #x.z = :x_z, #q = :q",
      ExpressionAttributeValues: { ":x_y": "foo", ":q": 10, ":x_z": "x" },
      ExpressionAttributeNames: { '#x': 'x', '#q': 'q' }
    }
  )
})

test("Null values should be deleted", (t) => {
  t.plan(4)

  t.deepEqual(
    merge({ x: null }),
    {
      UpdateExpression: "DELETE #x",
      ExpressionAttributeValues: {},
      ExpressionAttributeNames: { '#x': 'x' }
    }
  )

  t.deepEqual(
    merge({ x: null, y: "foo" }),
    {
      UpdateExpression: "SET #y = :y DELETE #x",
      ExpressionAttributeValues: { ":y": "foo" },
      ExpressionAttributeNames: { '#x': 'x', '#y': 'y' }
    }
  )


  t.deepEqual(
    merge({ x: { y: null, z: { w: 42 } }, q: 0 }),
    {
      UpdateExpression: "SET #x.z.w = :x_z_w, #q = :q DELETE #x.y",
      ExpressionAttributeValues: { ":x_z_w": 42, ":q": 0 },
      ExpressionAttributeNames: { '#x': 'x', '#q': 'q' }
    }
  )

  t.deepEqual(
    merge({ x: { y: null }, q: 0 }),
    {
      UpdateExpression: "SET #q = :q DELETE #x.y",
      ExpressionAttributeValues: { ":q": 0 },
      ExpressionAttributeNames: { '#x': 'x', '#q': 'q' }
    }
  )
})

test("Undefineds should be left alone", (t) => {
  t.plan(2)

  t.deepEqual(
    merge({ x: undefined }),
    { UpdateExpression: "", ExpressionAttributeValues: {}, ExpressionAttributeNames: {} }
  )

  t.deepEqual(
    merge({ x: { y: undefined, z: { w: 42 } }, q: 0 }),
    {
      UpdateExpression: "SET #x.z.w = :x_z_w, #q = :q",
      ExpressionAttributeValues: { ":x_z_w": 42, ":q": 0 },
      ExpressionAttributeNames: { '#x': 'x', '#q': 'q' }
    }
  )
})

test("Booleans", (t) => {
  t.plan(1)

  t.deepEqual(
    merge({ x: false }),
    {
      UpdateExpression: "SET #x = :x",
      ExpressionAttributeValues: { ":x": false },
      ExpressionAttributeNames: { '#x': 'x' }
    }
  )
})
