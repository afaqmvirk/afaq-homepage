import React from "react";

export default function SocialBar() {
  return (
    <>
      <a href="https://instagram.com/afaqmvirk" target="_blank">
        <img
          src="/instagram.svg"
          className="h-[3rem] invert hover:scale-110"
        ></img>
      </a>
      <a href="https://github.com/afaqmvirk" target="_blank">
        <img
          src="/github.svg"
          className="h-[3rem] invert hover:scale-110"
        ></img>
      </a>
      <a href="https://linkedin.com/in/afaqmvirk" target="_blank">
        <img
          src="/linkedin.svg"
          className="h-[3rem] invert hover:scale-110"
        ></img>
      </a>
      <a
        href="https://create.kahoot.it/profiles/35e825e0-8026-49fe-89c5-74cf77bccee3"
        target="_blank"
      >
        <img src="/kahoot.png" className="h-[3rem] hover:scale-110"></img>
      </a>
    </>
  );
}
