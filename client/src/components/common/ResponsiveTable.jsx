import { Children, cloneElement, isValidElement } from "react";
const textOf = (node) => Children.toArray(node).map((item) =>
  isValidElement(item) ? textOf(item.props.children) : String(item ?? "")
).join("");

// Keep a single set of rows/actions: table on desktop, labelled records on phones.
export default function ResponsiveTable({ children, className = "", ...props }) {
  const headings = [];
  function collect(node) {
    Children.forEach(node, (child) => {
      if (!isValidElement(child)) return;
      if (child.type === "th") headings.push(textOf(child.props.children));
      else collect(child.props.children);
    });
  }
  Children.forEach(children, (child) => {
    if (isValidElement(child) && child.type === "thead") collect(child.props.children);
  });
  function decorate(nodes, inBody = false) {
    return Children.map(nodes, (child) => {
      if (!isValidElement(child)) return child;
      if (child.type === "tr" && inBody) {
        let index = 0;
        function cells(items) {
          return Children.map(items, (cell) => {
            if (!isValidElement(cell)) return cell;
            if (cell.type !== "td") return cloneElement(cell, {}, cells(cell.props.children));
            const label = headings[index++];
            if (cell.props.colSpan > 1) return cell;
            return cloneElement(cell, { role: "cell" },
              <span className="mobile-cell-label" aria-hidden="true">{label}</span>,
              <div className="mobile-cell-value">{cell.props.children}</div>);
          });
        }
        return cloneElement(child, { role: "row" }, cells(child.props.children));
      }
      return cloneElement(child, {}, decorate(child.props.children, inBody || child.type === "tbody"));
    });
  }
  return <table {...props} role="table" className={`responsive-table ${className}`}>{decorate(children)}</table>;
}
