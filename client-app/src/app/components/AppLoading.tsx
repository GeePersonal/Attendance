import React from 'react';
import styled from 'styled-components';

interface Props {
  text?: string;
}

function AppLoading({ text }: Props) {
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-black/50 text-white backdrop-blur-sm">
      <StyledWrapper>
        <div className="loader-wrapper">
          <div className="juggler">
            <div className="head" />
            <div className="body" />
            <div className="arm right-arm" />
            <div className="arm left-arm" />
          </div>
          <div className="ball ball-1" />
          <div className="ball ball-2" />
          <div className="ball ball-3" />
        </div>
      </StyledWrapper>
      {text && <h1 className="text-white text-3xl mt-4 font-light tracking-wide">{text}</h1>}
    </div>
  );
}

const StyledWrapper = styled.div`
  .loader-wrapper {
    position: relative;
    width: 120px;
    height: 120px;
  }

  .juggler {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
  }

  .head {
    width: 24px;
    height: 24px;
    background: #fff;
    border-radius: 50%;
    position: absolute;
    top: -34px;
    left: -12px;
    animation: head-drop 6s infinite;
    transform-origin: center bottom;
  }

  .body {
    width: 16px;
    height: 40px;
    background: #fff;
    border-radius: 8px;
    position: absolute;
    top: -5px;
    left: -8px;
  }

  .arm {
    width: 8px;
    height: 32px;
    background: #fff;
    border-radius: 4px;
    position: absolute;
    top: -2px;
    transform-origin: 4px 4px;
  }

  .right-arm {
    left: 2px;
    animation: right-arm-juggle 6s infinite;
  }

  .left-arm {
    left: -10px;
    animation: left-arm-juggle 6s infinite;
  }

  .ball {
    width: 14px;
    height: 14px;
    border-radius: 50%;
    position: absolute;
    top: 50%;
    left: 50%;
    margin-top: -12px;
    margin-left: -7px;
  }

  .ball-1 {
    background: #ff4757;
    animation: ball1 6s infinite;
  }

  .ball-2 {
    background: #1e90ff;
    animation: ball2 6s infinite;
  }

  .ball-3 {
    background: #2ed573;
    animation: ball3 6s infinite;
  }

  @keyframes head-drop {
    0%,
    50% {
      transform: rotate(0deg) translate(0, 0);
    }
    55%,
    65% {
      transform: rotate(8deg) translate(1px, 0);
    }
    60%,
    70% {
      transform: rotate(-8deg) translate(-1px, 0);
    }
    75% {
      transform: rotate(0deg) translate(0, 0);
    }
    80%,
    100% {
      transform: rotate(-20deg) translate(-2px, 5px);
    }
  }

  @keyframes right-arm-juggle {
    0%,
    8.33%,
    16.66%,
    25%,
    33.33%,
    41.66%,
    50% {
      transform: rotate(-50deg);
    }
    4.16%,
    12.5%,
    20.83%,
    29.16%,
    37.5%,
    45.83% {
      transform: rotate(-10deg);
    }
    55% {
      transform: rotate(-70deg);
    }
    60% {
      transform: rotate(0deg);
    }
    68% {
      transform: rotate(-80deg);
    }
    75%,
    100% {
      transform: rotate(10deg);
    }
  }

  @keyframes left-arm-juggle {
    0%,
    8.33%,
    16.66%,
    25%,
    33.33%,
    41.66%,
    50% {
      transform: rotate(40deg);
    }
    4.16%,
    12.5%,
    20.83%,
    29.16%,
    37.5%,
    45.83% {
      transform: rotate(10deg);
    }
    55% {
      transform: rotate(60deg);
    }
    62% {
      transform: rotate(-10deg);
    }
    70% {
      transform: rotate(70deg);
    }
    75%,
    100% {
      transform: rotate(-10deg);
    }
  }

  @keyframes ball1 {
    0%,
    25%,
    50% {
      transform: translate(25px, 20px);
      animation-timing-function: ease-out;
      opacity: 1;
    }
    8.33%,
    33.33% {
      transform: translate(0px, -45px);
      animation-timing-function: ease-in;
    }
    16.66%,
    41.66% {
      transform: translate(-25px, 20px);
      animation-timing-function: linear;
    }
    58.33% {
      transform: translate(15px, -65px);
      animation-timing-function: ease-in;
    }
    66.66% {
      transform: translate(-30px, 30px);
      animation-timing-function: linear;
    }
    75% {
      transform: translate(30px, 15px);
      animation-timing-function: ease-in;
    }
    80% {
      transform: translate(35px, 60px);
      animation-timing-function: ease-out;
    }
    85% {
      transform: translate(40px, 50px);
      animation-timing-function: ease-in;
    }
    90% {
      transform: translate(45px, 60px);
      opacity: 1;
    }
    95%,
    100% {
      transform: translate(45px, 60px);
      opacity: 0;
    }
  }

  @keyframes ball2 {
    0%,
    25%,
    50% {
      transform: translate(-25px, 20px);
      animation-timing-function: linear;
      opacity: 1;
    }
    8.33%,
    33.33% {
      transform: translate(25px, 20px);
      animation-timing-function: ease-out;
    }
    16.66%,
    41.66% {
      transform: translate(0px, -45px);
      animation-timing-function: ease-in;
    }
    58.33% {
      transform: translate(35px, 10px);
      animation-timing-function: ease-out;
    }
    66.66% {
      transform: translate(-10px, -55px);
      animation-timing-function: ease-in;
    }
    75% {
      transform: translate(-35px, 25px);
      animation-timing-function: linear;
    }
    83% {
      transform: translate(-40px, 60px);
      animation-timing-function: ease-out;
    }
    88% {
      transform: translate(-45px, 52px);
      animation-timing-function: ease-in;
    }
    93% {
      transform: translate(-50px, 60px);
      opacity: 1;
    }
    98%,
    100% {
      transform: translate(-50px, 60px);
      opacity: 0;
    }
  }

  @keyframes ball3 {
    0%,
    25%,
    50% {
      transform: translate(0px, -45px);
      animation-timing-function: ease-in;
      opacity: 1;
    }
    8.33%,
    33.33% {
      transform: translate(-25px, 20px);
      animation-timing-function: linear;
    }
    16.66%,
    41.66% {
      transform: translate(25px, 20px);
      animation-timing-function: ease-out;
    }
    58.33% {
      transform: translate(-15px, 35px);
      animation-timing-function: linear;
    }
    66.66% {
      transform: translate(35px, 0px);
      animation-timing-function: ease-out;
    }
    75% {
      transform: translate(5px, -15px);
      animation-timing-function: ease-in;
    }
    81% {
      transform: translate(10px, 60px);
      animation-timing-function: ease-out;
    }
    86% {
      transform: translate(15px, 55px);
      animation-timing-function: ease-in;
    }
    91% {
      transform: translate(20px, 60px);
      opacity: 1;
    }
    96%,
    100% {
      transform: translate(20px, 60px);
      opacity: 0;
    }
  }
`;

export default AppLoading;
