/**
 * Gets the next prefix
 * @param {String} prefix - Previous prefix
 * @param {Any} val - Value of the array
 * @param {Boolean} isFromArray - true if the value became originally from an array
 * @returns {String} - Next prefix
 */
const getNextPrefix = (prefix, val, isFromArray) => {
  if (isFromArray) {
    return prefix
  }

  if (!isFromArray && prefix === "") {
    return `#${val}`
  }

  return `${prefix}.${val}`
}

/**
 * @param {string} prefix - Current prefix
 * @param {object|array} updates - Current set of updates
 * @param {{sets, adds}} accumulator - Object containing set of adds and sets
 * @param {string} type - type of item to add to
 * @param {integer|string} type - the index of the item if it came from an array, otherwise ""
 * @returns {{sets, adds}} - Object containing set of adds and sets
 */
const merge = (prefix, updates, accumulator, type, itemIndex = "") => {
  const typeOfUpdates = typeof updates
  const separator = type === "sets" ? " = " : " "
  const newAcc = Object.assign({}, accumulator)

  if (typeOfUpdates === "undefined") {
    return newAcc
  }

  if (updates === null) {
    if (type === "sets") {
      newAcc.deletes.push(prefix)
    }

    if (type === "adds") {
      newAcc.removes.push(`${updates}`)
    }

    const namesKey = prefix.replace(/^#([^\.]+).*/, "$1", "")
    newAcc.attributeNames[`#${namesKey}`] = namesKey
    return newAcc
  }

  if (typeOfUpdates === "function") {
    return merge(prefix, updates(), newAcc, type)
  }

  if (typeOfUpdates === "object") {
    const isFromArray = Array.isArray(updates)
    const arr = isFromArray ? updates : Object.keys(updates)

    var z = arr.reduce((prev, current, currentIndex) => {
      const value = isFromArray ? current : updates[current]
      const index = isFromArray ? currentIndex : ""
      return merge(getNextPrefix(prefix, current, isFromArray), value, newAcc, Array.isArray(value) ? "adds" : type, index)
    }, newAcc)
    return z
  }

  const key = `:${prefix}${itemIndex}`.replace(/\./g, "_").replace(/^\:#/, ":")
  newAcc.params[key] = updates
  const namesKey = key.replace(/^\:([^_]+).*/, "$1")
  newAcc.attributeNames[`#${namesKey}`] = namesKey
  newAcc[type].push(`${prefix}${separator}${key}`)
  return newAcc
}

module.exports = (updates) => {
  const {
    sets,
    adds,
    removes,
    deletes,
    params,
    attributeNames
  } = merge("", updates, { sets: [], adds: [], removes: [], deletes: [], params: {}, attributeNames: {} }, "sets")

  const setsString = sets.length ? `SET ${sets.join(", ")} ` : ""
  const addsString = adds.length ? `ADD ${adds.join(", ")} ` : ""
  const deletesString = deletes.length ? `DELETE ${deletes.join(", ")} ` : ""
  const removesString = removes.length ? `REMOVE ${removes.join(", ")} ` : ""

  return {
    UpdateExpression: `${setsString}${addsString}${deletesString}${removesString}`.trim(),
    ExpressionAttributeValues: params,
    ExpressionAttributeNames: attributeNames
  }
}
