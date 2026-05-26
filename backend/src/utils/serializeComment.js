function serializeComment(comment) {
  const row = comment.toJSON ? comment.toJSON() : comment;
  return {
    ...row,
    created_at: row.created_at ?? row.createdAt,
  };
}

module.exports = { serializeComment };
