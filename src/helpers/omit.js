export default (object, attributes = []) => {
    if (!Array.isArray(attributes)) {
        return object;
    }

    const omit = a => key => !a.includes(key);

    const keys = Object.keys(object)
        .filter(omit(attributes));

    return keys.reduce((prev, key) => ({ ...prev, [key]: object[key] }), {});
};
