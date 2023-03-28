import React from "react";
import { Sound } from "../../assets/";
import { LocalStorage } from "../../services/";

export const clickSoundd = new Sound("click_sound.m4a");

interface ButtonProps
  extends React.DetailedHTMLProps<
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    HTMLButtonElement
  > {
  noDefaultSound?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  onClick,
  noDefaultSound,
  ...props
}) => {
  return (
    <button
      onClick={(e) => {
        noDefaultSound || clickSoundd.play();
        onClick?.(e);
      }}
      {...props}
    />
  );
};
