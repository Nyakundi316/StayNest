"use client";

import Link from "next/link";
import { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost";
type Size = "sm" | "md" | "lg";

interface BaseProps {
  variant?: Variant;
  size?: Size;
  children: ReactNode;
  className?: string;
}

interface AsButton extends BaseProps, Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className" | "children"> {
  href?: never;
}
interface AsLink extends BaseProps {
  href: string;
}

type Props = AsButton | AsLink;

const sizes: Record<Size, string> = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-5 py-2.5 text-sm",
  lg: "px-6 py-3 text-base"
};

const variants: Record<Variant, string> = {
  primary: "btn-primary",
  secondary: "btn-secondary",
  ghost: "btn-ghost"
};

export default function Button(props: Props) {
  const { variant = "primary", size = "md", className = "", children } = props;
  const cls = `${variants[variant]} ${sizes[size]} ${className}`;

  if ("href" in props && props.href) {
    return (
      <Link href={props.href} className={cls}>
        {children}
      </Link>
    );
  }
  const { variant: _v, size: _s, className: _c, children: _ch, ...rest } = props as AsButton;
  return (
    <button className={cls} {...rest}>
      {children}
    </button>
  );
}
