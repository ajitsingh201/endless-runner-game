import React, { useRef, useState, useEffect, useCallback, useMemo } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { useControls } from '../hooks/useControls'
import { GAME_CONFIG } from '../constants/gameConfig'
import { playCoinSound, playImpactSound } from '../utils/sounds'
import { setMusicBPM } from '../utils/music'
import * as THREE from 'three'

const LANES = GAME_CONFIG.LANES
const TRACK_LENGTH = 200
const SEGMENT_LENGTH = 20

// Ground tile that loops
function GroundTile({ z }) {
  return (
    <group position={[0, -0.5, z]}>
      {/* Main track */}
      <mesh receiveShadow>
        <boxGeometry args={[9, 0.2, SEGMENT_LENGTH]} />
        <meshLambertMaterial color="#2d2d3d" />
      </mesh>
      {/* Lane dividers */}
      {[-1.25, 1.25].map((x, i) => (
        <mesh key={i} position={[x, 0.11, 0]}>
          <boxGeometry args={[0.08, 0.02, SEGMENT_LENGTH]} />
          <meshLambertMaterial color="#555" />
        </mesh>
      ))}
      {/* Side walls */}
      {[-4.8, 4.8].map((x, i) => (
        <mesh key={i} position={[x, 0.5, 0]}>
          <boxGeometry args={[0.6, 1.2, SEGMENT_LENGTH]} />
          <meshLambertMaterial color="#1a1a2a" />
        </mesh>
      ))}
    </group>
  )
}

function Track({ speed }) {
  const groupRef = useRef()
  const tilesRef = useRef([])
  const numTiles = Math.ceil(TRACK_LENGTH / SEGMENT_LENGTH) + 2

  // Initialize tile positions
  if (tilesRef.current.length === 0) {
    for (let i = 0; i < numTiles; i++) {
      tilesRef.current.push(-(i * SEGMENT_LENGTH))
    }
  }

  useFrame((state, delta) => {
    const move = speed.current * delta
    tilesRef.current = tilesRef.current.map(z => {
      let newZ = z + move
      if (newZ > SEGMENT_LENGTH * 1.5) {
        newZ -= numTiles * SEGMENT_LENGTH
      }
      return newZ
    })
    if (groupRef.current) {
      groupRef.current.children.forEach((child, i) => {
        child.position.z = tilesRef.current[i]
      })
    }
  })

  return (
    <group ref={groupRef}>
      {tilesRef.current.map((z, i) => (
        <GroundTile key={i} z={z} />
      ))}
    </group>
  )
}

function Background() {
  return (
    <>
      {/* Sky backdrop */}
      <mesh position={[0, 20, -50]}>
        <planeGeometry args={[200, 80]} />
        <meshBasicMaterial color="#0f0f2e" />
      </mesh>
      {/* Buildings left side */}
      {[
        { x: -8,  z: -30, h: 6 },
        { x: -11, z: -15, h: 9 },
        { x: -14, z:   0, h: 5 },
        { x: -7,  z:  15, h: 8 },
        { x: -12, z:  30, h: 7 },
      ].map((b, i) => (
        <mesh key={`bl-${i}`} position={[b.x, b.h / 2, b.z]}>
          <boxGeometry args={[2, b.h, 2]} />
          <meshLambertMaterial color={`hsl(${220 + i * 10}, 30%, ${15 + i * 3}%)`} />
        </mesh>
      ))}
      {/* Buildings right side */}
      {[
        { x: 8,  z: -20, h: 7 },
        { x: 11, z:  -5, h: 10 },
        { x: 14, z:  10, h: 5 },
        { x: 7,  z:  22, h: 9 },
        { x: 12, z:  35, h: 6 },
      ].map((b, i) => (
        <mesh key={`br-${i}`} position={[b.x, b.h / 2, b.z]}>
          <boxGeometry args={[2, b.h, 2]} />
          <meshLambertMaterial color={`hsl(${230 + i * 10}, 28%, ${13 + i * 3}%)`} />
        </mesh>
      ))}
    </>
  )
}

function Player({ laneRef, jumpRef, slideRef, playerRef }) {
  const rootRef = useRef()
  const bodyGroupRef = useRef()
  const torsoRef = useRef()
  const headRef = useRef()
  const leftLegRef = useRef()
  const rightLegRef = useRef()
  const leftArmRef = useRef()
  const rightArmRef = useRef()
  const leanRef = useRef(0)

  useFrame((state, delta) => {
    if (!rootRef.current) return

    const t = state.clock.elapsedTime
    const isJumping = jumpRef.current.isJumping
    const isSliding = slideRef.current.isSliding

    // Smooth lane movement
    const targetX = LANES[laneRef.current]
    const currentX = rootRef.current.position.x
    rootRef.current.position.x += (targetX - currentX) * Math.min(1, GAME_CONFIG.LANE_CHANGE_SPEED * delta)

    // Jump / gravity
    jumpRef.current.vy += GAME_CONFIG.GRAVITY * delta
    jumpRef.current.y += jumpRef.current.vy * delta
    if (jumpRef.current.y <= 0) {
      jumpRef.current.y = 0
      jumpRef.current.vy = 0
      jumpRef.current.isJumping = false
    }
    rootRef.current.position.y = jumpRef.current.y

    // Slide squish on bodyGroup
    if (bodyGroupRef.current) {
      if (isSliding) {
        bodyGroupRef.current.scale.y = THREE.MathUtils.lerp(bodyGroupRef.current.scale.y, 0.45, 0.25)
        bodyGroupRef.current.position.y = THREE.MathUtils.lerp(bodyGroupRef.current.position.y, -0.45, 0.25)
      } else {
        bodyGroupRef.current.scale.y = THREE.MathUtils.lerp(bodyGroupRef.current.scale.y, 1, 0.2)
        bodyGroupRef.current.position.y = THREE.MathUtils.lerp(bodyGroupRef.current.position.y, 0, 0.2)
      }

      // Lane-change lean (tilt body sideways)
      const dx = targetX - rootRef.current.position.x
      leanRef.current = THREE.MathUtils.lerp(leanRef.current, dx * -0.18, 8 * delta)
      bodyGroupRef.current.rotation.z = leanRef.current
    }

    if (!isJumping && !isSliding) {
      // === Running cycle ===
      const cycle = t * 8

      // Vertical bob: peaks twice per stride (abs sine)
      rootRef.current.position.y = jumpRef.current.y + Math.abs(Math.sin(cycle)) * 0.07

      // Torso: slight forward lean + gentle side-to-side sway
      if (torsoRef.current) {
        torsoRef.current.rotation.x = THREE.MathUtils.lerp(torsoRef.current.rotation.x, 0.18, 0.12)
        torsoRef.current.rotation.z = Math.sin(cycle) * 0.04
      }
      // Head: counter-lean to stay upright
      if (headRef.current) {
        headRef.current.rotation.x = THREE.MathUtils.lerp(headRef.current.rotation.x, -0.08, 0.12)
        headRef.current.rotation.z = Math.sin(cycle + Math.PI) * 0.03
      }

      // Legs alternate: left forward when right is back
      const legSwing = Math.sin(cycle) * 0.65
      if (leftLegRef.current)  leftLegRef.current.rotation.x = legSwing
      if (rightLegRef.current) rightLegRef.current.rotation.x = -legSwing

      // Arms alternate opposite to legs
      const armSwing = Math.sin(cycle) * 0.55
      if (leftArmRef.current)  leftArmRef.current.rotation.x = -armSwing
      if (rightArmRef.current) rightArmRef.current.rotation.x = armSwing

    } else if (isJumping) {
      // === Jump pose: legs tuck, arms raise ===
      const tuck = 0.55
      if (leftLegRef.current)  leftLegRef.current.rotation.x  = THREE.MathUtils.lerp(leftLegRef.current.rotation.x, tuck, 0.2)
      if (rightLegRef.current) rightLegRef.current.rotation.x = THREE.MathUtils.lerp(rightLegRef.current.rotation.x, tuck, 0.2)
      if (leftArmRef.current)  leftArmRef.current.rotation.x  = THREE.MathUtils.lerp(leftArmRef.current.rotation.x, -0.9, 0.2)
      if (rightArmRef.current) rightArmRef.current.rotation.x = THREE.MathUtils.lerp(rightArmRef.current.rotation.x, -0.9, 0.2)
      if (torsoRef.current)    torsoRef.current.rotation.x    = THREE.MathUtils.lerp(torsoRef.current.rotation.x, 0, 0.2)
      if (headRef.current)     headRef.current.rotation.x     = THREE.MathUtils.lerp(headRef.current.rotation.x, 0, 0.2)

    } else if (isSliding) {
      // === Slide pose: legs stretch back, arms flat ===
      if (leftLegRef.current)  leftLegRef.current.rotation.x  = THREE.MathUtils.lerp(leftLegRef.current.rotation.x, -0.3, 0.3)
      if (rightLegRef.current) rightLegRef.current.rotation.x = THREE.MathUtils.lerp(rightLegRef.current.rotation.x, -0.3, 0.3)
      if (leftArmRef.current)  leftArmRef.current.rotation.x  = THREE.MathUtils.lerp(leftArmRef.current.rotation.x, 0.6, 0.3)
      if (rightArmRef.current) rightArmRef.current.rotation.x = THREE.MathUtils.lerp(rightArmRef.current.rotation.x, 0.6, 0.3)
    }

    // Update playerRef for collision detection
    if (playerRef) {
      playerRef.current = {
        x: rootRef.current.position.x,
        y: rootRef.current.position.y,
        isSliding,
        isJumping,
      }
    }
  })

  return (
    <group ref={rootRef} position={[0, 0, 2]}>
      <group ref={bodyGroupRef}>
        {/* Torso */}
        <mesh ref={torsoRef} castShadow position={[0, 0.65, 0]}>
          <boxGeometry args={[0.65, 0.85, 0.45]} />
          <meshLambertMaterial color="#FF6B35" />
        </mesh>

        {/* Head */}
        <mesh ref={headRef} castShadow position={[0, 1.35, 0]}>
          <boxGeometry args={[0.52, 0.52, 0.52]} />
          <meshLambertMaterial color="#FFCB8E" />
        </mesh>
        {/* Eyes */}
        <mesh position={[0.14, 1.38, 0.27]}>
          <boxGeometry args={[0.11, 0.11, 0.05]} />
          <meshBasicMaterial color="#1a1a2e" />
        </mesh>
        <mesh position={[-0.14, 1.38, 0.27]}>
          <boxGeometry args={[0.11, 0.11, 0.05]} />
          <meshBasicMaterial color="#1a1a2e" />
        </mesh>

        {/* Left leg — pivot at hip joint */}
        <group ref={leftLegRef} position={[0.18, 0.28, 0]}>
          <mesh castShadow position={[0, -0.22, 0]}>
            <boxGeometry args={[0.24, 0.44, 0.38]} />
            <meshLambertMaterial color="#3366CC" />
          </mesh>
          <mesh castShadow position={[0, -0.49, 0.06]}>
            <boxGeometry args={[0.26, 0.12, 0.44]} />
            <meshLambertMaterial color="#222233" />
          </mesh>
        </group>

        {/* Right leg — pivot at hip joint */}
        <group ref={rightLegRef} position={[-0.18, 0.28, 0]}>
          <mesh castShadow position={[0, -0.22, 0]}>
            <boxGeometry args={[0.24, 0.44, 0.38]} />
            <meshLambertMaterial color="#3366CC" />
          </mesh>
          <mesh castShadow position={[0, -0.49, 0.06]}>
            <boxGeometry args={[0.26, 0.12, 0.44]} />
            <meshLambertMaterial color="#222233" />
          </mesh>
        </group>

        {/* Left arm — pivot at shoulder */}
        <group ref={leftArmRef} position={[0.44, 1.02, 0]}>
          <mesh castShadow position={[0, -0.18, 0]}>
            <boxGeometry args={[0.22, 0.38, 0.3]} />
            <meshLambertMaterial color="#FF6B35" />
          </mesh>
          <mesh castShadow position={[0, -0.4, 0]}>
            <boxGeometry args={[0.2, 0.16, 0.28]} />
            <meshLambertMaterial color="#FFCB8E" />
          </mesh>
        </group>

        {/* Right arm — pivot at shoulder */}
        <group ref={rightArmRef} position={[-0.44, 1.02, 0]}>
          <mesh castShadow position={[0, -0.18, 0]}>
            <boxGeometry args={[0.22, 0.38, 0.3]} />
            <meshLambertMaterial color="#FF6B35" />
          </mesh>
          <mesh castShadow position={[0, -0.4, 0]}>
            <boxGeometry args={[0.2, 0.16, 0.28]} />
            <meshLambertMaterial color="#FFCB8E" />
          </mesh>
        </group>
      </group>
    </group>
  )
}

function Obstacle({ obstacle, speed, onCollide, playerRef }) {
  const meshRef = useRef()
  const hitRef = useRef(false)

  useFrame((state, delta) => {
    if (!meshRef.current || hitRef.current) return

    meshRef.current.position.z += speed.current * delta

    // Collision check zone
    if (meshRef.current.position.z > -2 && meshRef.current.position.z < 3) {
      const player = playerRef.current
      if (!player) return

      const dx = Math.abs(player.x - meshRef.current.position.x)
      const obstacleHeight = obstacle.type === 'LOW' ? 0.6 : 1.8
      const obstacleY = obstacle.type === 'LOW' ? 0.3 : 0.9

      // Player hitbox
      const playerEffectiveTop = player.isSliding ? 0.8 : 1.8
      const playerBottom = player.y

      const xOverlap = dx < (0.35 + obstacle.width / 2)
      const yOverlap =
        playerBottom < (obstacleY + obstacleHeight / 2) &&
        playerEffectiveTop > (obstacleY - obstacleHeight / 2)

      if (xOverlap && yOverlap) {
        hitRef.current = true
        onCollide([player.x, player.y + 0.9, meshRef.current.position.z])
      }
    }

    // Hide when passed player
    if (meshRef.current.position.z > 8) {
      meshRef.current.visible = false
    }
  })

  const isLow = obstacle.type === 'LOW'

  return (
    <group ref={meshRef} position={[LANES[obstacle.lane], 0, obstacle.z]}>
      {isLow ? (
        // Low barrier - player must slide
        <mesh castShadow position={[0, 0.3, 0]}>
          <boxGeometry args={[obstacle.width, 0.6, 1.2]} />
          <meshLambertMaterial color="#CC3333" />
        </mesh>
      ) : (
        // Tall obstacle - player must jump or switch lane
        <>
          <mesh castShadow position={[0, 0.9, 0]}>
            <boxGeometry args={[obstacle.width, 1.8, 1.0]} />
            <meshLambertMaterial color="#882222" />
          </mesh>
          {/* Warning stripe overlay */}
          <mesh position={[0, 0.9, 0.51]}>
            <planeGeometry args={[obstacle.width, 1.8]} />
            <meshBasicMaterial color="#FF4444" transparent opacity={0.3} />
          </mesh>
        </>
      )}
    </group>
  )
}

function Coin({ coin, speed, onCollect, playerRef }) {
  const meshRef = useRef()
  const collected = useRef(false)

  useFrame((state, delta) => {
    if (!meshRef.current || collected.current) return

    meshRef.current.position.z += speed.current * delta
    meshRef.current.rotation.y += delta * 3

    // Hover float animation
    meshRef.current.position.y = coin.y + Math.sin(state.clock.elapsedTime * 4 + coin.offset) * 0.1

    // Coin collection check
    if (meshRef.current.position.z > -2 && meshRef.current.position.z < 3) {
      const player = playerRef.current
      if (!player) return

      const dx = Math.abs(player.x - meshRef.current.position.x)
      const dy = Math.abs(player.y + 0.9 - meshRef.current.position.y)

      if (dx < 0.8 && dy < 1.0) {
        collected.current = true
        meshRef.current.visible = false
        onCollect([
          meshRef.current.position.x,
          meshRef.current.position.y,
          meshRef.current.position.z,
        ])
      }
    }

    if (meshRef.current.position.z > 8) {
      meshRef.current.visible = false
    }
  })

  return (
    <mesh ref={meshRef} position={[LANES[coin.lane], coin.y, coin.z]}>
      <cylinderGeometry args={[0.25, 0.25, 0.08, 12]} />
      <meshLambertMaterial color="#FFD700" emissive="#996600" emissiveIntensity={0.3} />
    </mesh>
  )
}

function CoinBurst({ id, position, onDone }) {
  const groupRef = useRef()
  const timeRef = useRef(0)
  const doneRef = useRef(false)

  const PARTICLE_COUNT = 18

  // Stable per-burst particle layout
  const particles = useMemo(() => {
    return Array.from({ length: PARTICLE_COUNT }, (_, i) => {
      const angle = (i / PARTICLE_COUNT) * Math.PI * 2 + (Math.random() - 0.5) * 0.4
      const speed = 1.8 + Math.random() * 2.4
      const colors = ['#FFD700', '#FFA500', '#FFE066', '#FFFFFF', '#FFC107']
      return {
        vx: Math.cos(angle) * speed,
        vy: 2.5 + Math.random() * 3.0,
        vz: Math.sin(angle) * speed * 0.2,
        size: 0.06 + Math.random() * 0.08,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotSpeedX: (Math.random() - 0.5) * 12,
        rotSpeedZ: (Math.random() - 0.5) * 12,
      }
    })
  }, [])

  useFrame((_, delta) => {
    if (!groupRef.current || doneRef.current) return

    timeRef.current += delta
    const t = timeRef.current

    if (t > 0.75) {
      doneRef.current = true
      onDone(id)
      return
    }

    const opacity = Math.max(0, 1 - t / 0.6)

    groupRef.current.children.forEach((mesh, i) => {
      const p = particles[i]
      mesh.position.x = p.vx * t
      mesh.position.y = p.vy * t - 7 * t * t   // arc with gravity
      mesh.position.z = p.vz * t
      mesh.rotation.x += delta * p.rotSpeedX
      mesh.rotation.z += delta * p.rotSpeedZ
      mesh.material.opacity = opacity
    })
  })

  return (
    <group ref={groupRef} position={position}>
      {particles.map((p, i) => (
        <mesh key={i}>
          <boxGeometry args={[p.size, p.size, p.size]} />
          <meshBasicMaterial color={p.color} transparent opacity={1} />
        </mesh>
      ))}
    </group>
  )
}

function ImpactBurst({ id, position, onDone }) {
  const groupRef = useRef()
  const timeRef = useRef(0)
  const doneRef = useRef(false)

  const PARTICLE_COUNT = 30

  const particles = useMemo(() => {
    const colors = ['#FF2222', '#FF5500', '#FF8800', '#FFCC00', '#CC0000', '#FF4444', '#FFFFFF']
    return Array.from({ length: PARTICLE_COUNT }, (_, i) => {
      const angle = (i / PARTICLE_COUNT) * Math.PI * 2 + (Math.random() - 0.5) * 0.6
      const speed = 2.0 + Math.random() * 5.0
      return {
        vx: Math.cos(angle) * speed,
        vy: 0.5 + Math.random() * 6.0,
        vz: Math.sin(angle) * speed * 0.35,
        size: 0.07 + Math.random() * 0.16,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotSpeedX: (Math.random() - 0.5) * 18,
        rotSpeedZ: (Math.random() - 0.5) * 18,
      }
    })
  }, [])

  useFrame((_, delta) => {
    if (!groupRef.current || doneRef.current) return

    timeRef.current += delta
    const t = timeRef.current

    if (t > 1.1) {
      doneRef.current = true
      onDone(id)
      return
    }

    const opacity = Math.max(0, 1 - t / 0.9)

    groupRef.current.children.forEach((mesh, i) => {
      const p = particles[i]
      mesh.position.x = p.vx * t
      mesh.position.y = p.vy * t - 9 * t * t
      mesh.position.z = p.vz * t
      mesh.rotation.x += delta * p.rotSpeedX
      mesh.rotation.z += delta * p.rotSpeedZ
      mesh.material.opacity = opacity
    })
  })

  return (
    <group ref={groupRef} position={position}>
      {particles.map((p, i) => (
        <mesh key={i}>
          <boxGeometry args={[p.size, p.size, p.size]} />
          <meshBasicMaterial color={p.color} transparent opacity={1} />
        </mesh>
      ))}
    </group>
  )
}

function GameScene({ onGameOver, onAddCoin, onAddScore }) {
  const speedRef = useRef(GAME_CONFIG.INITIAL_SPEED)
  const laneRef = useRef(1) // 0=left, 1=center, 2=right
  const jumpRef = useRef({ y: 0, vy: 0, isJumping: false })
  const slideRef = useRef({ isSliding: false, timer: 0 })
  const playerRef = useRef({ x: 0, y: 0, isSliding: false, isJumping: false })
  const [obstacles, setObstacles] = useState([])
  const [coins, setCoins] = useState([])
  const [bursts, setBursts] = useState([])
  const [impactBurst, setImpactBurst] = useState(null)
  const obstacleTimerRef = useRef(0)
  const coinTimerRef = useRef(0)
  const speedTimerRef = useRef(0)
  const gameOverRef = useRef(false)
  const scoreTimerRef = useRef(0)

  const { keys, consumeJustPressed } = useControls()

  const handleGameOver = useCallback(() => {
    if (!gameOverRef.current) {
      gameOverRef.current = true
      onGameOver()
    }
  }, [onGameOver])

  const handleCoinCollect = useCallback((position) => {
    playCoinSound()
    setBursts(prev => [...prev, { id: Date.now() + Math.random(), position }])
    onAddCoin()
  }, [onAddCoin])

  const handleBurstDone = useCallback((id) => {
    setBursts(prev => prev.filter(b => b.id !== id))
  }, [])

  const handleObstacleHit = useCallback((position) => {
    if (!gameOverRef.current) {
      playImpactSound()
      setImpactBurst({ id: Date.now(), position })
      gameOverRef.current = true
      onGameOver()
    }
  }, [onGameOver])

  const handleImpactDone = useCallback(() => {
    setImpactBurst(null)
  }, [])

  useFrame((state, delta) => {
    if (gameOverRef.current) return

    // Increase speed over time
    speedTimerRef.current += delta
    if (speedTimerRef.current >= GAME_CONFIG.SPEED_INCREMENT_INTERVAL) {
      speedTimerRef.current = 0
      speedRef.current = Math.min(speedRef.current + GAME_CONFIG.SPEED_INCREMENT, 45)
      setMusicBPM(Math.round(115 + speedRef.current))
    }

    // Distance-based score (every 0.1s)
    scoreTimerRef.current += delta
    if (scoreTimerRef.current >= 0.1) {
      scoreTimerRef.current = 0
      onAddScore(1)
    }

    // Lane change controls
    if (consumeJustPressed('ArrowLeft') || consumeJustPressed('KeyA')) {
      laneRef.current = Math.max(0, laneRef.current - 1)
    }
    if (consumeJustPressed('ArrowRight') || consumeJustPressed('KeyD')) {
      laneRef.current = Math.min(2, laneRef.current + 1)
    }

    // Jump
    if (
      (consumeJustPressed('Space') || consumeJustPressed('ArrowUp') || consumeJustPressed('KeyW')) &&
      !jumpRef.current.isJumping
    ) {
      jumpRef.current.vy = GAME_CONFIG.JUMP_FORCE
      jumpRef.current.isJumping = true
    }

    // Slide (hold key)
    if (keys['ArrowDown'] || keys['KeyS']) {
      slideRef.current.isSliding = true
      slideRef.current.timer = 0.5
    }

    // Slide timer - auto-release after duration
    if (slideRef.current.isSliding) {
      slideRef.current.timer -= delta
      if (slideRef.current.timer <= 0) {
        slideRef.current.isSliding = false
      }
    }

    // Spawn obstacles
    obstacleTimerRef.current += delta
    const spawnInterval = Math.max(0.8, 2.5 - (speedRef.current - GAME_CONFIG.INITIAL_SPEED) * 0.05)
    if (obstacleTimerRef.current >= spawnInterval) {
      obstacleTimerRef.current = 0
      const lane = Math.floor(Math.random() * 3)
      const type = Math.random() > 0.4 ? 'TALL' : 'LOW'
      const width = type === 'TALL' ? (Math.random() > 0.5 ? 1.5 : 0.9) : 2.0

      setObstacles(prev => [
        ...prev.filter(o => o.z < -GAME_CONFIG.OBSTACLE_SPAWN_DISTANCE + 5),
        {
          id: Date.now() + Math.random(),
          lane,
          z: -GAME_CONFIG.OBSTACLE_SPAWN_DISTANCE,
          type,
          width,
        },
      ].slice(-15))
    }

    // Spawn coins
    coinTimerRef.current += delta
    if (coinTimerRef.current >= 1.2) {
      coinTimerRef.current = 0
      const lane = Math.floor(Math.random() * 3)
      const count = Math.floor(Math.random() * 3) + 2
      const newCoins = []
      for (let i = 0; i < count; i++) {
        newCoins.push({
          id: Date.now() + i + Math.random(),
          lane,
          z: -GAME_CONFIG.COIN_SPAWN_DISTANCE - i * 2,
          y: 0.8 + Math.random() * 0.3,
          offset: Math.random() * Math.PI * 2,
        })
      }
      setCoins(prev => [
        ...prev.filter(c => c.z < -GAME_CONFIG.COIN_SPAWN_DISTANCE + 5),
        ...newCoins,
      ].slice(-30))
    }
  })

  return (
    <>
      <Track speed={speedRef} />
      <Background />
      <Player laneRef={laneRef} jumpRef={jumpRef} slideRef={slideRef} playerRef={playerRef} />
      {obstacles.map(obstacle => (
        <Obstacle
          key={obstacle.id}
          obstacle={obstacle}
          speed={speedRef}
          onCollide={handleObstacleHit}
          playerRef={playerRef}
        />
      ))}
      {coins.map(coin => (
        <Coin
          key={coin.id}
          coin={coin}
          speed={speedRef}
          onCollect={handleCoinCollect}
          playerRef={playerRef}
        />
      ))}
      {bursts.map(burst => (
        <CoinBurst
          key={burst.id}
          id={burst.id}
          position={burst.position}
          onDone={handleBurstDone}
        />
      ))}
      {impactBurst && (
        <ImpactBurst
          key={impactBurst.id}
          id={impactBurst.id}
          position={impactBurst.position}
          onDone={handleImpactDone}
        />
      )}
    </>
  )
}

export default function Game({ onGameOver, onAddCoin, onAddScore }) {
  return (
    <Canvas
      shadows
      camera={{ position: [0, 5, 10], fov: 70, near: 0.1, far: 300 }}
      style={{ background: '#0f0f2e' }}
    >
      <ambientLight intensity={0.4} />
      <directionalLight
        position={[5, 10, 5]}
        intensity={1.2}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
      <pointLight position={[-5, 5, 0]} intensity={0.5} color="#4444ff" />
      <fog attach="fog" args={['#0f0f2e', 30, 80]} />
      <GameScene
        onGameOver={onGameOver}
        onAddCoin={onAddCoin}
        onAddScore={onAddScore}
      />
    </Canvas>
  )
}
