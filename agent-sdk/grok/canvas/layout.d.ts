import type { JSX, ReactNode } from "react";
import type { Tone } from "./components.js";
export interface GridProps {
    /** Most cells per row. Cells wrap to fewer when the page is narrow. */
    columns?: 2 | 3;
    /** The cells: blocks, custom visuals, or whole `Section`s. */
    children?: ReactNode;
}
/**
 * Two or three blocks side by side: small multiples, a chart next to its
 * breakdown, a before and after. Put it inside a `Section` to share one
 * heading, or directly in the `Page` with a `Section` per cell.
 *
 * @example
 * ```tsx
 * <Grid columns={2}>
 *   <Section heading="Revenue by region"><Bars bars={regions} /></Section>
 *   <Section heading="Share of orders"><Pie parts={channels} /></Section>
 * </Grid>
 * ```
 */
export declare function Grid({ columns, children }: GridProps): JSX.Element;
export interface SegmentedProps {
    /** Two to five short labels. */
    options: readonly string[];
    /** The selected label. */
    value: string;
    onChange: (value: string) => void;
}
/**
 * A quiet text switch for the view, metric, period, or filter a section
 * shows. Keep the selection in `useState` and compute each view from the
 * embedded data.
 *
 * @example
 * ```tsx
 * const [metric, setMetric] = useState("Revenue");
 * <Segmented options={["Revenue", "Orders"]} value={metric} onChange={setMetric} />
 * ```
 */
export declare function Segmented({ options, value, onChange }: SegmentedProps): JSX.Element;
export interface Metric {
    /** The figure as it should read, e.g. "1.9%" or "$1.2M". */
    value: string;
    label: string;
    /** Quiet note under the label, e.g. "+12% vs Q2". */
    detail?: string;
    /** Colors `detail` when it is good or bad news. */
    tone?: Tone;
}
export interface MetricsProps {
    /** Two to four headline figures. */
    metrics: readonly Metric[];
}
/**
 * A strip of headline figures on the page, no cards. It is the template
 * answer, so use it only when these few numbers are the point of the page;
 * otherwise put them in `Rows` or a `Table` next to what explains them. On a
 * phone, four figures sit two by two instead of three and an orphan.
 */
export declare function Metrics({ metrics }: MetricsProps): JSX.Element;
//# sourceMappingURL=layout.d.ts.map