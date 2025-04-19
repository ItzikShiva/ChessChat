import React from 'react';
import styled from 'styled-components';

const BackgroundContainer = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: -1;
  background: linear-gradient(135deg, #1a1a1a 0%, #2c2c2c 100%);
  overflow: hidden;
`;

const ChessPattern = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  opacity: 0.1;
  background-image: 
    linear-gradient(45deg, #ffffff 25%, transparent 25%),
    linear-gradient(-45deg, #ffffff 25%, transparent 25%),
    linear-gradient(45deg, transparent 75%, #ffffff 75%),
    linear-gradient(-45deg, transparent 75%, #ffffff 75%);
  background-size: 60px 60px;
  background-position: 0 0, 0 30px, 30px -30px, -30px 0px;
  animation: moveBackground 30s linear infinite;

  @keyframes moveBackground {
    0% {
      background-position: 0 0, 0 30px, 30px -30px, -30px 0px;
    }
    100% {
      background-position: 60px 60px, 60px 90px, 90px 30px, 30px 60px;
    }
  }
`;

const FloatingPieces = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  opacity: 0.15;

  &::before {
    content: '♔♕♖♗♘♙';
    position: absolute;
    font-size: 80px;
    color: #ffffff;
    animation: floatPieces 15s ease-in-out infinite;
    white-space: nowrap;
  }

  &::after {
    content: '♚♛♜♝♞♟';
    position: absolute;
    font-size: 80px;
    color: #ffffff;
    animation: floatPieces2 20s ease-in-out infinite;
    white-space: nowrap;
    top: 50%;
  }

  @keyframes floatPieces {
    0%, 100% {
      transform: translate(-10%, 20%) rotate(-10deg);
    }
    50% {
      transform: translate(110%, 30%) rotate(10deg);
    }
  }

  @keyframes floatPieces2 {
    0%, 100% {
      transform: translate(110%, -10%) rotate(10deg);
    }
    50% {
      transform: translate(-10%, 0%) rotate(-10deg);
    }
  }
`;

const Overlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: radial-gradient(circle at 50% 50%, transparent 0%, rgba(0,0,0,0.3) 100%);
`;

const ChessBackground = () => {
  return (
    <BackgroundContainer>
      <ChessPattern />
      <FloatingPieces />
      <Overlay />
    </BackgroundContainer>
  );
};

export default ChessBackground; 