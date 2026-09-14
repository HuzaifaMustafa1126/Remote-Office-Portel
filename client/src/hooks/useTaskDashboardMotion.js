import { useLayoutEffect } from "react";
import gsap from "gsap";

export default function useTaskDashboardMotion(scope, dependency) {
  useLayoutEffect(() => {
    if (!scope.current) return undefined;
    const reduced =
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    const context = gsap.context(() => {
      const visible =
        ".task-summary-card,.task-insight-strip,.task-analytics-card,.activity-area,.activity-line,.activity-point,.completion-stat,.workload-bar,.project-progress";
      gsap.set(visible, { opacity: 1, visibility: "visible" });
      if (reduced) {
        gsap.set(visible, {
          clearProps: "transform,strokeDasharray,strokeDashoffset",
        });
        return;
      }

      gsap.from(".task-summary-card", {
        y: 18,
        scale: 0.97,
        duration: 0.42,
        stagger: 0.055,
        ease: "power3.out",
      });
      gsap.from(".task-summary-icon", {
        y: 5,
        duration: 0.3,
        stagger: 0.04,
        ease: "power2.out",
      });
      gsap.from(".task-spark-bar", {
        scaleY: 0.2,
        transformOrigin: "bottom",
        duration: 0.45,
        stagger: 0.015,
        ease: "power3.out",
      });
      gsap.from(".task-insight-strip", {
        y: 8,
        duration: 0.35,
        ease: "power2.out",
      });
      gsap.from(".task-analytics-card", {
        y: 14,
        duration: 0.42,
        stagger: 0.05,
        ease: "power3.out",
      });
      gsap.from(".activity-area", {
        opacity: 0.35,
        duration: 0.5,
        ease: "power2.out",
      });
      gsap.from(".activity-line", {
        opacity: 0.45,
        duration: 0.55,
        ease: "power2.out",
      });
      gsap.from(".activity-point", {
        scale: 0.55,
        transformOrigin: "center",
        duration: 0.3,
        stagger: 0.006,
      });
      gsap.from(".completion-meter", {
        rotate: -18,
        duration: 0.65,
        ease: "power3.out",
      });
      gsap.from(".completion-stat", {
        y: 5,
        duration: 0.3,
        stagger: 0.025,
        ease: "power2.out",
      });
      gsap.from(".workload-bar", {
        scaleY: 0.15,
        transformOrigin: "bottom",
        duration: 0.58,
        stagger: 0.008,
        ease: "power3.out",
      });
      gsap.from(".project-progress", {
        scaleX: 0.15,
        transformOrigin: "left",
        duration: 0.55,
        stagger: 0.04,
        ease: "power3.out",
      });
      gsap.fromTo(
        ".task-count-number",
        { textContent: 0 },
        {
          textContent: (index, target) => Number(target.dataset.value || 0),
          duration: 0.65,
          snap: { textContent: 1 },
          stagger: 0.035,
          ease: "power2.out",
        },
      );
    }, scope);
    return () => context.revert();
  }, [scope, dependency]);
}
