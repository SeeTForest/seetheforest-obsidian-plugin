import type { VaultEntry } from "./graph";
type Predicate = (entry: VaultEntry) => boolean;

/** Explicit supported grammar. Unsupported native operators fail visibly. */
export function compileSearch(query: string): Predicate {
  const tokens =
    query.match(/(?:[a-z]+:)?"(?:\\.|[^"\\])*"|\[[^\]]*\]|[()]|-|[^\s()]+/gi) ??
    [];
  let cursor = 0;
  const peek = () => tokens[cursor];
  function atom(): Predicate {
    const token = tokens[cursor++];
    if (!token) throw new Error("搜索表达式缺少条件");
    if (token === "-") {
      const child = atom();
      return (n) => !child(n);
    }
    if (token.startsWith("-") && token.length > 1) {
      tokens.splice(cursor, 0, token.slice(1));
      const child = atom();
      return (n) => !child(n);
    }
    if (token === "(") {
      const result = or();
      if (tokens[cursor++] !== ")") throw new Error("搜索括号不匹配");
      return result;
    }
    if (token === ")" || token === "OR" || token === "AND")
      throw new Error("搜索表达式缺少条件");
    if (token.startsWith("[")) {
      const [key = "", ...values] = token.slice(1, -1).split(":");
      const value = values.join(":").trim().toLocaleLowerCase();
      return (n) =>
        Object.hasOwn(n.properties, key.trim()) &&
        (!values.length ||
          String(n.properties[key.trim()]).toLocaleLowerCase().includes(value));
    }
    const operator = /^([a-z]+):(.*)$/i.exec(token);
    const field = operator?.[1]?.toLowerCase() ?? "text";
    let value = operator?.[2] ?? token;
    if (value.startsWith('"')) {
      if (!value.endsWith('"') || value.length === 1)
        throw new Error("搜索引号未闭合");
      value = value.slice(1, -1).replace(/\\"/g, '"');
    }
    if (!value || value.includes('"')) throw new Error("搜索条件无效");
    value = value.toLocaleLowerCase();
    if (!["path", "file", "tag", "content", "text"].includes(field))
      throw new Error(`暂不支持原生搜索操作符：${field}`);
    if (value.startsWith("/"))
      throw new Error("正则搜索尚未支持，请使用普通词或带引号短语");
    return (entry) => {
      if (field === "path")
        return entry.path.toLocaleLowerCase().includes(value);
      if (field === "file")
        return entry.path
          .split("/")
          .at(-1)!
          .toLocaleLowerCase()
          .includes(value);
      if (field === "tag") {
        const target = value.startsWith("#") ? value : `#${value}`;
        return entry.tags.some(
          (tag) =>
            tag.toLocaleLowerCase() === target ||
            tag.toLocaleLowerCase().startsWith(`${target}/`),
        );
      }
      return (
        field === "content"
          ? (entry.text ?? "")
          : `${entry.path}\n${entry.text ?? ""}`
      )
        .toLocaleLowerCase()
        .includes(value);
    };
  }
  function and(): Predicate {
    const terms: Predicate[] = [atom()];
    while (peek() && peek() !== ")" && peek() !== "OR") {
      if (peek() === "AND") cursor++;
      terms.push(atom());
    }
    return (entry) => terms.every((test) => test(entry));
  }
  function or(): Predicate {
    const terms = [and()];
    while (peek() === "OR") {
      cursor++;
      terms.push(and());
    }
    return (entry) => terms.some((test) => test(entry));
  }
  if (!tokens.length) return () => true;
  const result = or();
  if (cursor !== tokens.length) throw new Error("搜索表达式未结束");
  return result;
}
