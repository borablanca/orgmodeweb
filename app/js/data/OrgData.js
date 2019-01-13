(() => {
  ORG.Data = {
    set: (data, newData) => Object.assign(data, newData),
    setWithCursor: (data, field, values, cursor) => {
      let index = values.indexOf(data[field]);
      // if cursor is truthy, set next value in the setting values
      // index overflow works because it makes value undefined
      if (cursor) data[field] = values[index + 1];
      else data[field] = values[(index >= 0 ? index : values.length) - 1]; // if falsy set prev value in the setting values
      return data;
    },
    toggleTag: (data, newTags) => {
      let tags = data.tags ? data.tags.split(":").filter(Boolean) : [];
      newTags.split(/:| /).forEach((tag) => {
        let index = tags.indexOf(tag);
        index > -1 ? tags.splice(index, 1) : (tags[tags.length] = tag);
      });
      tags.length ? data.tags = `:${tags.join(":")}:` : delete data.tags;
      return data;
    },
  };
})();
