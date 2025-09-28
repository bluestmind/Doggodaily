import React, { useRef, useState, Suspense, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, useGLTF, useAnimations, Text, Environment, ContactShadows } from '@react-three/drei';

import { useRef as useReactRef } from 'react';
import * as THREE from 'three';
import { FaStar, FaQuoteLeft, FaPaw, FaHeart, FaShieldAlt, FaCrown, FaPlay, FaArrowRight, FaBone, FaEye, FaExpand, FaImages, FaVideo, FaCamera, FaMapMarkerAlt } from 'react-icons/fa';
import { useLanguage } from '../contexts/LanguageContext';
import { apiCall } from '../config/api';


// ---- Gallery / Reels inspired by @doggodailly ----
const galleryMedia = [
  {
    id: 1,
    type: 'image',
    src: 'https://images.unsplash.com/photo-1518717758536-85ae29035b6d?w=1080&h=1350&fit=crop',
    thumb: 'https://images.unsplash.com/photo-1518717758536-85ae29035b6d?w=400&h=400&fit=crop',
    alt: 'Street portrait of a brown dog with sweet eyes',
    title: 'Bruno — Sweet Eyes',
    category: 'Portrait',
    location: 'Turin, Italy',
    date: '2025-08-29',
    views: 128000,
    likes: 9400,
    photographer: 'Doggo Dailly',
    description: 'A gentle soul we met on a busy sidewalk. One look, and the city stopped for a second.'
  },
  {
    id: 2,
    type: 'video',
    src: 'https://www.w3schools.com/html/mov_bbb.mp4',
    thumb: 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=400&h=400&fit=crop',
    alt: 'Close-up of a smiling corgi, reel cover',
    title: 'Street Reel — Corgi Grins',
    category: 'Reel',
    location: 'Rome, Italy',
    date: '2025-08-22',
    views: 412000,
    likes: 28000,
    photographer: 'Doggo Dailly',
    description: '30 seconds of pure corgi sunshine from the Eternal City.',
    duration: '0:30'
  },
  {
    id: 3,
    type: 'image',
    src: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=1080&h=1350&fit=crop',
    thumb: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400&h=400&fit=crop',
    alt: 'Golden dog smiling at the camera on cobblestones',
    title: 'Sunny Piazzetta',
    category: 'Portrait',
    location: 'Naples, Italy',
    date: '2025-08-18',
    views: 154000,
    likes: 11300,
    photographer: 'Doggo Dailly',
    description: 'A golden grin that matches the Neapolitan sun.'
  },
  {
    id: 4,
    type: 'image',
    src: 'https://images.unsplash.com/photo-1602067340370-bdcebe8b1737?w=1080&h=1350&fit=crop',
    thumb: 'https://images.unsplash.com/photo-1602067340370-bdcebe8b1737?w=400&h=400&fit=crop',
    alt: 'Senior dog with soft grey muzzle',
    title: 'Silver Muzzle, Golden Heart',
    category: 'Portrait',
    location: 'Bologna, Italy',
    date: '2025-08-11',
    views: 98000,
    likes: 8600,
    photographer: 'Doggo Dailly',
    description: 'Years of love in one quiet gaze.'
  },
  {
    id: 5,
    type: 'video',
    src: 'https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4',
    thumb: 'https://images.unsplash.com/photo-1551717743-49959800b1f6?w=400&h=400&fit=crop',
    alt: 'Dog peeking from a car window, reel cover',
    title: 'Drive-By Hellos',
    category: 'Reel',
    location: 'Milan, Italy',
    date: '2025-08-03',
    views: 365000,
    likes: 24500,
    photographer: 'Doggo Dailly',
    description: 'Window-down greetings from the fashion capital.',
    duration: '0:21'
  },
  {
    id: 6,
    type: 'image',
    src: 'https://images.unsplash.com/photo-1534361960057-19889db9621e?w=1080&h=1350&fit=crop',
    thumb: 'https://images.unsplash.com/photo-1534361960057-19889db9621e?w=400&h=400&fit=crop',
    alt: 'Small dog sitting proudly on a stroller',
    title: 'Tiny Captain',
    category: 'Portrait',
    location: 'Genoa, Italy',
    date: '2025-07-29',
    views: 123000,
    likes: 9700,
    photographer: 'Doggo Dailly',
    description: 'Commanding the promenade from the comfiest seat in town.'
  },
  {
    id: 7,
    type: 'image',
    src: 'https://images.unsplash.com/photo-1517849845537-4d257902454a?w=1080&h=1350&fit=crop',
    thumb: 'https://images.unsplash.com/photo-1517849845537-4d257902454a?w=400&h=400&fit=crop',
    alt: 'Playful puppy portrait on the street',
    title: 'Puppy Blink',
    category: 'Portrait',
    location: 'Florence, Italy',
    date: '2025-07-21',
    views: 142000,
    likes: 11000,
    photographer: 'Doggo Dailly',
    description: 'A blink, a bounce, a brand-new best friend.'
  },
  {
    id: 8,
    type: 'image',
    src: 'https://images.unsplash.com/photo-1552053831-71594a27632d?w=1080&h=1350&fit=crop',
    thumb: 'https://images.unsplash.com/photo-1552053831-71594a27632d?w=400&h=400&fit=crop',
    alt: 'Dog strolling through a lively piazza',
    title: 'Passeggiata',
    category: 'Street',
    location: 'Rome, Italy',
    date: '2025-07-14',
    views: 189000,
    likes: 13700,
    photographer: 'Doggo Dailly',
    description: 'Evening walks, clinking cups, wagging tails—Italy at dog level.'
  }
];


// ---- Stats aligned with the IG profile screenshot ----
const getStats = (t) => [
  { number: '797',   label: t('home.stats.posts'),                 icon: FaPaw },
  { number: '1.6M+', label: t('home.stats.followers'),             icon: FaHeart },
  { number: '300+',  label: t('home.stats.reels'),  icon: FaPlay },
  { number: '40+',   label: t('home.stats.cities'),icon: FaCrown }
];

// 3D Dog Pack Component with Enhanced Features
function DogWithGround({ onDogClick }) {
  const group = useRef();
  const dog3Group = useRef();
  const { scene: dogScene, animations } = useGLTF('/models/dog.glb');
  const { scene: dog2Scene } = useGLTF('/models/dog2.glb');
  const { scene: dog3Scene, animations: dog3Animations } = useGLTF('/models/dog3.glb');
  const { scene: dog4Scene } = useGLTF('/models/dog4.glb');
  const { scene: groundScene } = useGLTF('/models/stone_ground.glb');
  const { actions, names } = useAnimations(animations, group);
  const { actions: dog3Actions, names: dog3Names } = useAnimations(dog3Animations, dog3Group);
  const [current, setCurrent] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [dog3Current, setDog3Current] = useState(0);
  const [dog3Playing, setDog3Playing] = useState(false);
  const [offset, setOffset] = useState({ dogY: 0, scale: 20.2, groundScale: 4.2 });
  const { camera } = useThree();
  const animationOrder = ['Sit', 'RollOver', 'ShakePaw'];

  // Debug: Log available animations and hide loading when model is ready
  useEffect(() => {
    console.log('=== DOG PACK MODEL DEBUG ===');
    console.log('Main dog scene loaded:', !!dogScene);
    console.log('Dog2 scene loaded:', !!dog2Scene);
    console.log('Dog3 scene loaded:', !!dog3Scene);
    console.log('Dog4 scene loaded:', !!dog4Scene);
    console.log('Ground scene loaded:', !!groundScene);
    console.log('Animations available:', animations?.length || 0);
    console.log('Animation names:', names);
    console.log('Actions object:', actions);
    console.log('=======================');
    
    // All models loaded
    if (dogScene && dog2Scene && dog3Scene && dog4Scene && groundScene) {
      console.log('All models loaded successfully!');
    }
  }, [dogScene, dog2Scene, dog3Scene, dog4Scene, groundScene, animations, names, actions]);

  // Responsive scale/position
  useEffect(() => {
    function handleResize() {
      const width = window.innerWidth;
      if (width < 600) {
        setOffset(o => ({ ...o, scale: 25, groundScale: 5 }));
      } else if (width < 900) {
        setOffset(o => ({ ...o, scale: 22, groundScale: 5 }));
      } else {
        setOffset(o => ({ ...o, scale: 20.2, groundScale: 4.2 }));
      }
    }
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Enhanced Y offset calculation
  useEffect(() => {
    if (!dogScene || !groundScene) return;
    let dogY = 0.8;
    if (window.innerWidth < 600) {
      dogY = -0.2;
    } else if (window.innerWidth < 900) {
      dogY = -0.3;
    }
    setOffset(o => ({ ...o, dogY }));
  }, [dogScene, groundScene, offset.scale, offset.groundScale]);

  // Remove rotation, let model play its own idle animation
  useFrame((state) => {
    if (group.current) {
      // Only subtle floating, no rotation
      const baseY = offset.dogY;
      const floatOffset = Math.sin(state.clock.elapsedTime * 0.8) * 0.02;
      group.current.position.y = baseY + floatOffset;
    }
  });

  // Force camera positioning - runs on every render to ensure it sticks
  useEffect(() => {
    console.log('=== CAMERA POSITIONING EFFECT ===');
    console.log('dogScene loaded:', !!dogScene);
    console.log('groundScene loaded:', !!groundScene);
    console.log('Current camera position:', camera.position);
    
    // Set camera position regardless of model loading
    const fov = 65;
    camera.fov = fov;
    camera.updateProjectionMatrix();
    
         // FORCE camera to be EXTREMELY far back
     camera.position.set(0, 60, 100);
     camera.lookAt(0, 70, 0);
    
    console.log('NEW camera position set to:', camera.position);
    console.log('Camera distance from origin:', camera.position.distanceTo(new THREE.Vector3(0, 0, 0)));
    console.log('===============================');
  }, [camera]); // Removed dependencies to force it to run

  // Enhanced animation handling - FIX: Ensure animations work properly
  const playAnimation = (idx) => {
    const animName = animationOrder[idx];
    console.log('Playing animation:', animName, 'Available animations:', names);
    
    if (actions && actions[animName]) {
      setIsPlaying(true);
      
      // Stop all current animations first
      Object.values(actions).forEach(action => {
        if (action && typeof action.stop === 'function') {
          action.stop();
          action.reset();
        }
      });
      
      // Small delay to ensure stopping is complete
      setTimeout(() => {
                  try {
            const targetAction = actions[animName];
            if (targetAction) {
              targetAction.reset();
              // Set animation to play once
              if (targetAction.setLoop) {
                targetAction.setLoop(2200, 1); // THREE.LoopOnce = 2200
              }
              targetAction.clampWhenFinished = true;
              targetAction.play();
              console.log('Animation started successfully:', animName);
              console.log('Action duration:', targetAction.getClip()?.duration || 'unknown');
              
              // Auto-stop after animation duration or fallback
              const duration = targetAction.getClip()?.duration || 2;
              setTimeout(() => {
                setIsPlaying(false);
                console.log('Animation finished:', animName);
              }, (duration * 1000) + 500); // Add 500ms buffer
            }
          } catch (error) {
            console.error('Error playing animation:', error);
            setIsPlaying(false);
          }
      }, 100);
    } else {
      console.warn('Animation not found:', animName, 'Available:', Object.keys(actions || {}));
      setIsPlaying(false);
    }
  };

  // Let the model play its own built-in animation automatically
  useEffect(() => {
    if (names.length > 0 && actions && Object.keys(actions).length > 0) {
      console.log('Initializing animations. Available:', names);
      console.log('Animation order:', animationOrder);
      console.log('Actions object:', actions);
      
      // Play the first available animation as idle/gift animation
      setTimeout(() => {
        const idleAnimation = names[0]; // Use the first animation as idle
        if (actions[idleAnimation]) {
          console.log('Starting idle animation:', idleAnimation);
          actions[idleAnimation].reset();
          if (actions[idleAnimation].setLoop) {
            actions[idleAnimation].setLoop(2201, Infinity); // THREE.LoopRepeat = 2201
          }
          actions[idleAnimation].play();
        }
      }, 1000);
    }
  }, [actions, names]);

  // Dog3 animation initialization
  useEffect(() => {
    if (dog3Names.length > 0 && dog3Actions && Object.keys(dog3Actions).length > 0) {
      console.log('Initializing Dog3 animations. Available:', dog3Names);
      console.log('Dog3 Actions object:', dog3Actions);
      
      // Play the first available animation as idle/gift animation for dog3
      setTimeout(() => {
        const idleAnimation = dog3Names[0]; // Use the first animation as idle
        if (dog3Actions[idleAnimation]) {
          console.log('Starting Dog3 idle animation:', idleAnimation);
          dog3Actions[idleAnimation].reset();
          if (dog3Actions[idleAnimation].setLoop) {
            dog3Actions[idleAnimation].setLoop(2201, Infinity); // THREE.LoopRepeat = 2201
          }
          dog3Actions[idleAnimation].play();
        }
      }, 1500); // Slightly delayed after main dog
    }
  }, [dog3Actions, dog3Names]);

  // Dog3 animation function
  const playDog3Animation = (idx) => {
    const animName = dog3Names[idx] || dog3Names[0]; // Fallback to first animation
    console.log('Playing Dog3 animation:', animName, 'Available animations:', dog3Names);
    
    if (dog3Actions && dog3Actions[animName]) {
      setDog3Playing(true);
      
      // Stop all current dog3 animations first
      Object.values(dog3Actions).forEach(action => {
        if (action && typeof action.stop === 'function') {
          action.stop();
          action.reset();
        }
      });
      
      // Small delay to ensure stopping is complete
      setTimeout(() => {
        try {
          const targetAction = dog3Actions[animName];
          if (targetAction) {
            targetAction.reset();
            // Set animation to play once
            if (targetAction.setLoop) {
              targetAction.setLoop(2200, 1); // THREE.LoopOnce = 2200
            }
            targetAction.clampWhenFinished = true;
            targetAction.play();
            console.log('Dog3 Animation started successfully:', animName);
            
            // Auto-stop after animation duration or fallback
            const duration = targetAction.getClip()?.duration || 2;
            setTimeout(() => {
              setDog3Playing(false);
              console.log('Dog3 Animation finished:', animName);
            }, (duration * 1000) + 500); // Add 500ms buffer
          }
        } catch (error) {
          console.error('Error playing Dog3 animation:', error);
          setDog3Playing(false);
        }
      }, 100);
    }
  };

  // Expose animation trigger to parent
  useEffect(() => {
    if (!onDogClick || !onDogClick.current) return;
    
    onDogClick.current = () => {
      console.log('Dog clicked! Current:', current, 'Available actions:', Object.keys(actions || {}));
      const nextIdx = (current + 1) % Math.min(animationOrder.length, names.length);
      console.log('Next animation index:', nextIdx, 'Animation name:', animationOrder[nextIdx]);
      playAnimation(nextIdx);
      setCurrent(nextIdx);
      
      // Also trigger dog3 animation
      if (dog3Names.length > 0) {
        const dog3NextIdx = (dog3Current + 1) % dog3Names.length;
        playDog3Animation(dog3NextIdx);
        setDog3Current(dog3NextIdx);
      }
    };
  }, [onDogClick, current, actions, names, dog3Current, dog3Actions, dog3Names]);

  // Define positions for each dog in the pack (4 dogs total)
  const dogPositions = [
    { x: 0, z: 0, rotation: 0 },      // Main dog (center)
    { x: -50.8, z: 1.2, rotation: 0.4 },  // Dog2 (left-back, farther)
    { x: 50.8, z: 1.0, rotation: -0.3 },  // Dog3 (right-back, farther)
    { x: 60.2, z: -25.5,rotation: 0.6 }   // Dog4 (left-front, farther)
  ];

  return (
    <group position={[0, -2, 0]}>
      <Environment preset="sunset" />
      <ContactShadows 
        position={[0, -0.1, 0]} 
        scale={15} 
        far={20} 
        blur={2} 
        opacity={0.3}
      />
      {/* Ground */}
      <primitive 
        object={groundScene} 
        scale={offset.groundScale} 
        position={[0, 0, 0]} 
      />
      
      {/* Main Dog with animations (center) */}
      <group 
        ref={group} 
        scale={offset.scale} 
        position={[dogPositions[0].x, offset.dogY, dogPositions[0].z]} 
        rotation={[0, dogPositions[0].rotation, 0]}
      >
        <primitive 
          object={dogScene} 
          onClick={(e) => {
            e.stopPropagation();
            console.log('=== MAIN DOG CLICKED ===');
            console.log('Event:', e);
            console.log('onDogClick ref:', onDogClick);
            console.log('onDogClick.current:', onDogClick?.current);
            if (onDogClick && onDogClick.current) {
              onDogClick.current();
            } else {
              console.warn('onDogClick not available');
            }
          }}
        />
        {isPlaying && (
          <mesh position={[0, 1, 0]}>
            <ringGeometry args={[0.8, 1, 32]} />
            <meshBasicMaterial color="#00bfae" transparent opacity={0.3} />
          </mesh>
        )}
      </group>
        
      {/* Dog Pack Members */}
      <group 
        scale={offset.scale * 0.76 }
        position={[dogPositions[1].x, offset.dogY, dogPositions[1].z]}
        rotation={[0, dogPositions[1].rotation, 0]}
      >
        <primitive object={dog2Scene} />
      </group>

      <group 
        ref={dog3Group}
        scale={offset.scale * 0.03 }
        position={[dogPositions[2].x, offset.dogY, dogPositions[2].z]}
        rotation={[0, dogPositions[2].rotation, 0]}
      >
        <primitive 
          object={dog3Scene} 
          onClick={(e) => {
            e.stopPropagation();
            console.log('=== DOG3 CLICKED ===');
            if (dog3Names.length > 0) {
              const nextIdx = (dog3Current + 1) % dog3Names.length;
              playDog3Animation(nextIdx);
              setDog3Current(nextIdx);
            }
          }}
        />
        {dog3Playing && (
          <mesh position={[0, 1, 0]}>
            <ringGeometry args={[0.8, 1, 32]} />
            <meshBasicMaterial color="#4ecdff" transparent opacity={0.3} />
          </mesh>
        )}
      </group>

      <group 
        scale={offset.scale * 2.8} 
        position={[dogPositions[3].x, offset.dogY, dogPositions[3].z]}
        rotation={[0, dogPositions[3].rotation, 0]}
      >
        <primitive object={dog4Scene} />
      </group>

      {/* Pack floating animation */}
      <group>
        {dogPositions.slice(1).map((pos, index) => (
          <mesh 
            key={index}
            position={[pos.x * offset.scale, offset.dogY + 0.1, pos.z * offset.scale]}
          >
            <sphereGeometry args={[0.02, 8, 8]} />
            <meshBasicMaterial 
              color="#00bfae" 
              transparent 
              opacity={0.3}
            />
          </mesh>
        ))}
      </group>
    </group>
  );
}

// Loading Component for R3F - using Three.js objects only
function LoadingSpinner() {
  return (
    <mesh position={[0, 0, 0]}>
      <sphereGeometry args={[0.5, 32, 32]} />
      <meshStandardMaterial 
        color="#00bfae" 
        transparent 
        opacity={0.6}
        emissive="#00bfae"
        emissiveIntensity={0.2}
      />
    </mesh>
  );
}

const HomePage = ({ mission, vision }) => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [showTooltip, setShowTooltip] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [showMediaModal, setShowMediaModal] = useState(false);
  const [videoPlaying, setVideoPlaying] = useState(false);
  const [featuredMedia, setFeaturedMedia] = useState([]);
  const [loadingFeatured, setLoadingFeatured] = useState(true);
  const [videoStates, setVideoStates] = useState({}); // Track video states by media ID
  const [isMobile, setIsMobile] = useState(false); // Track if user is on mobile
  const videoRefs = useRef({}); // Store video refs by media ID
  const dogClickRef = useReactRef();
  let tooltipTimeout = useRef();

  // Set dynamic page title
  useEffect(() => {
    document.title = 'DoggoDaily - Dog & Italy Adventures';
  }, []);

  // Load featured media from API
  const loadFeaturedMedia = async () => {
    try {
      setLoadingFeatured(true);
      console.log('🔄 Loading featured media from API...');
      const response = await apiCall('/api/admin/public/gallery/homepage-featured', 'GET');
      
      console.log('📡 API Response:', response);
      console.log('📊 Response success:', response.success);
      console.log('📊 Response data:', response.data);
      console.log('📊 Data length:', response.data?.length || 0);
      
      if (response.success && response.data && response.data.length > 0) {
        console.log('✅ Using API data for featured media');
        console.log('📊 Featured media items:', response.data);
        console.log('🔍 First item details:', response.data[0]);
        console.log('🖼️ First item thumb:', response.data[0]?.thumb);
        console.log('🎬 First item type:', response.data[0]?.type);
        setFeaturedMedia(response.data);
      } else {
        // Fallback to hardcoded data if API fails or no data
        console.warn('⚠️ No featured media from API, using fallback data');
        console.log('📋 Fallback data:', galleryMedia.slice(0, 6));
        console.log('💡 To fix this: Go to Admin Panel → Gallery Management → Click "Feature" on items you want on homepage');
        setFeaturedMedia(galleryMedia.slice(0, 6));
      }
    } catch (error) {
      console.error('❌ Error loading featured media:', error);
      console.log('📋 Using fallback data due to error');
      // Fallback to hardcoded data
      setFeaturedMedia(galleryMedia.slice(0, 6));
    } finally {
      setLoadingFeatured(false);
    }
  };

  // Load featured media on component mount
  useEffect(() => {
    loadFeaturedMedia();
  }, []);

  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
                           window.innerWidth <= 768 || 
                           ('ontouchstart' in window);
      setIsMobile(isMobileDevice);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Cleanup video refs and states when featured media changes
  useEffect(() => {
    // Clear video refs for media that no longer exists
    const currentMediaIds = featuredMedia.map(media => media.id);
    Object.keys(videoRefs.current).forEach(mediaId => {
      if (!currentMediaIds.includes(parseInt(mediaId))) {
        delete videoRefs.current[mediaId];
      }
    });
    
    // Clear video states for media that no longer exists
    setVideoStates(prev => {
      const newStates = {};
      currentMediaIds.forEach(id => {
        if (prev[id]) {
          newStates[id] = prev[id];
        }
      });
      return newStates;
    });
  }, [featuredMedia]);

  // Video state management functions
  const updateVideoState = (mediaId, updates) => {
    setVideoStates(prev => ({
      ...prev,
      [mediaId]: {
        ...prev[mediaId],
        ...updates
      }
    }));
  };

  const getVideoState = (mediaId) => {
    return videoStates[mediaId] || {
      isPlaying: false,
      isHovered: false,
      isLoading: false
    };
  };

  const handleVideoMouseEnter = (mediaId, videoRef) => {
    updateVideoState(mediaId, { isHovered: true });
    
    // Start video playback on hover for videos
    if (videoRef.current) {
      updateVideoState(mediaId, { isLoading: true });
      videoRef.current.currentTime = 0; // Reset to beginning
      videoRef.current.play().catch(console.error);
    }
  };

  const handleVideoMouseLeave = (mediaId, videoRef) => {
    updateVideoState(mediaId, { isHovered: false });
    
    // Pause video when not hovering
    if (videoRef.current) {
      videoRef.current.pause();
      updateVideoState(mediaId, { isPlaying: false });
    }
  };

  const handleVideoPlay = (mediaId) => {
    updateVideoState(mediaId, { isPlaying: true, isLoading: false });
  };

  const handleVideoPause = (mediaId) => {
    updateVideoState(mediaId, { isPlaying: false });
  };

  const handleVideoLoadStart = (mediaId) => {
    updateVideoState(mediaId, { isLoading: true });
  };

  const handleVideoCanPlay = (mediaId) => {
    updateVideoState(mediaId, { isLoading: false });
  };

  const handleVideoError = (mediaId) => {
    updateVideoState(mediaId, { isLoading: false });
    console.error('Video failed to load for media:', mediaId);
  };

  // Mobile touch handlers for video playback
  const handleVideoTouchStart = (mediaId, videoRef, e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (mediaId && videoRef.current) {
      const videoState = getVideoState(mediaId);
      
      if (videoState.isPlaying) {
        // If playing, pause it
        videoRef.current.pause();
        updateVideoState(mediaId, { isPlaying: false });
      } else {
        // If not playing, start playing
        updateVideoState(mediaId, { isLoading: true });
        videoRef.current.currentTime = 0;
        videoRef.current.play().catch(console.error);
      }
    }
  };

  const handleVideoTouchEnd = (mediaId, e) => {
    e.preventDefault();
    e.stopPropagation();
    // Touch end doesn't need to do anything special for videos
  };

  const handleDogClick = () => {
    console.log('=== HANDLE DOG CLICK CALLED ===');
    console.log('dogClickRef:', dogClickRef);
    console.log('dogClickRef.current:', dogClickRef.current);
    
    if (dogClickRef.current) {
      dogClickRef.current();
    } else {
      console.warn('dogClickRef.current is not set');
    }
    
    setShowTooltip(true);
    clearTimeout(tooltipTimeout.current);
    tooltipTimeout.current = setTimeout(() => setShowTooltip(false), 2500);
  };

  const scrollToSection = (sectionId) => {
    document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div style={{ width: '100%', minHeight: '100vh' }}>
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes sparkle {
          0%, 100% { opacity: 0; transform: scale(0); }
          50% { opacity: 1; transform: scale(1); }
        }
        @keyframes fadeIn {
          to { opacity: 1; }
        }
        .sparkle {
          animation: sparkle 2s ease-in-out infinite;
        }

        .stat-counter {
          font-size: clamp(2rem, 4vw, 3.5rem);
          font-weight: 800;
          background: var(--gradient-primary);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
      `}</style>

      {/* Enhanced Hero Section */}
      <section style={{
        minHeight: '100vh',
        background: 'var(--gradient-hero)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem 1rem',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Animated Background Elements */}
        <div style={{
          position: 'absolute',
          top: '10%',
          left: '10%',
          width: '20px',
          height: '20px',
          background: 'var(--primary-teal)',
          borderRadius: '50%',
          opacity: 0.3
        }} className="sparkle" />
        <div style={{
          position: 'absolute',
          top: '20%',
          right: '15%',
          width: '15px',
          height: '15px',
          background: 'var(--primary-blue)',
          borderRadius: '50%',
          opacity: 0.3
        }} className="sparkle" />
        <div style={{
          position: 'absolute',
          bottom: '30%',
          left: '20%',
          width: '25px',
          height: '25px',
          background: 'var(--accent-teal)',
          borderRadius: '50%',
          opacity: 0.2
        }} className="sparkle" />

        <div className="animate-fade-in-down" style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 style={{
            fontSize: 'clamp(2.5rem, 6vw, 5rem)',
            fontWeight: 900,
            background: 'var(--gradient-primary)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            marginBottom: '1rem',
            textShadow: '0 8px 16px rgba(0, 191, 174, 0.3)'
          }}>
            {t('home.welcomeTitle')}
          </h1>
          <p style={{
            fontSize: 'clamp(1.1rem, 2.5vw, 1.5rem)',
            color: 'var(--gray-600)',
            fontWeight: 500,
            maxWidth: '600px',
            margin: '0 auto 2rem auto',
            lineHeight: 1.6
          }}>
            {t('home.welcomeSubtitle')}
          </p>
          
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '2rem' }}>
            <button 
              className="btn btn-primary animate-scale-in hover-glow"
              onClick={() => navigate('/gallery')}
              style={{ animationDelay: '0.5s' }}
            >
              <FaBone style={{ marginRight: '0.5rem' }} />
              {t('home.joinCommunity')}
            </button>
            <button 
              className="btn btn-secondary animate-scale-in"
              onClick={() => setVideoPlaying(true)}
              style={{ animationDelay: '0.7s' }}
            >
              <FaPlay style={{ marginRight: '0.5rem' }} />
              {t('home.watchStory')}
            </button>
          </div>
        </div>

        {/* Enhanced 3D Dog Scene - COMMENTED OUT */}
        {/* <div className="animate-fade-in-up" style={{
          width: '100%',
          maxWidth: '800px',
          height: 'min(70vw, 400px)',
          margin: '2rem auto',
          borderRadius: 'var(--radius-3xl)',
          background: 'var(--gradient-card)',
          boxShadow: 'var(--shadow-premium)',
          border: '1px solid rgba(255, 255, 255, 0.3)',
          backdropFilter: 'blur(20px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '2px',
            background: 'var(--gradient-primary)',
            borderRadius: 'var(--radius-3xl) var(--radius-3xl) 0 0'
          }} />
          
          <Canvas 
            camera={{ position: [60, 160, 180], fov: 65 }} 
            style={{ width: '100%', height: '100%' }}
            onPointerMissed={() => console.log('Canvas clicked but missed mesh')}
            onCreated={() => {
              console.log('Canvas created successfully');
            }}
          >
            <ambientLight intensity={0.8} />
            <directionalLight position={[5, 5, 5]} intensity={0.8} />
            <pointLight position={[-5, 5, 5]} intensity={0.4} color="#00bfae" />
            <Suspense fallback={<LoadingSpinner />}>
              <DogWithGround onDogClick={dogClickRef} />
            </Suspense>
            <OrbitControls
              enableZoom={false}
              enablePan={false}
              target={[0, 2, 0]}
              minPolarAngle={Math.PI / 2.5}
              maxPolarAngle={Math.PI / 1.8}
            />
          </Canvas>
          
          {showTooltip && (
            <div className="animate-scale-in" style={{
              position: 'absolute',
              left: '50%',
              top: '15%',
              transform: 'translate(-50%, -50%)',
              background: 'var(--gradient-card)',
              color: 'var(--gray-800)',
              padding: '1rem 2rem',
              borderRadius: 'var(--radius-2xl)',
              fontWeight: 700,
              fontSize: '1.2rem',
              boxShadow: 'var(--shadow-premium)',
              border: '1px solid rgba(0, 191, 174, 0.3)',
              backdropFilter: 'blur(20px)',
              zIndex: 10,
              pointerEvents: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <FaBone style={{ color: 'var(--primary-teal)' }} />
              {t('home.dogGreeting')}
            </div>
          )}
          
          <div style={{
            position: 'absolute',
            bottom: '1rem',
            left: '50%',
            transform: 'translateX(-50%)',
            color: 'var(--gray-500)',
            fontSize: '0.9rem',
            fontWeight: 500,
            opacity: 0.8,
            cursor: 'pointer'
          }} onClick={handleDogClick}>
            {t('home.clickInstruction')} 🐕
          </div>
        </div> */}

        {/* Scroll Indicator */}
        <div className="animate-float" style={{
          position: 'absolute',
          bottom: '2rem',
          left: '50%',
          transform: 'translateX(-50%)',
          cursor: 'pointer'
        }} onClick={() => navigate('/gallery')}>
          <FaArrowRight style={{
            transform: 'rotate(90deg)',
            fontSize: '1.5rem',
            color: 'var(--primary-teal)',
            opacity: 0.7
          }} />
        </div>
      </section>

      {/* Enhanced Stats Section - COMMENTED OUT */}
      {/* <section style={{
        padding: '4rem 2rem',
        background: 'var(--gradient-card)',
        backdropFilter: 'blur(20px)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{
          position: 'absolute',
          top: '10%',
          left: '5%',
          fontSize: '4rem',
          opacity: 0.05,
          color: 'var(--primary-teal)',
          transform: 'rotate(-15deg)',
          userSelect: 'none',
          pointerEvents: 'none'
        }}>🐕</div>
        <div style={{
          position: 'absolute',
          top: '20%',
          right: '8%',
          fontSize: '3rem',
          opacity: 0.08,
          color: 'var(--primary-blue)',
          transform: 'rotate(25deg)',
          userSelect: 'none',
          pointerEvents: 'none'
        }}>🦴</div>
        <div style={{
          position: 'absolute',
          bottom: '15%',
          left: '12%',
          fontSize: '2.5rem',
          opacity: 0.06,
          color: 'var(--primary-teal)',
          transform: 'rotate(45deg)',
          userSelect: 'none',
          pointerEvents: 'none'
        }}>🐾</div>
        <div style={{
          position: 'absolute',
          bottom: '25%',
          right: '15%',
          fontSize: '3.5rem',
          opacity: 0.07,
          color: 'var(--primary-blue)',
          transform: 'rotate(-30deg)',
          userSelect: 'none',
          pointerEvents: 'none'
        }}>🎾</div>
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '2%',
          fontSize: '2rem',
          opacity: 0.04,
          color: 'var(--primary-teal)',
          transform: 'rotate(60deg)',
          userSelect: 'none',
          pointerEvents: 'none'
        }}>❤️</div>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '2rem',
            textAlign: 'center'
          }}>
            {getStats(t).map((stat, index) => (
              <div key={index} className="card hover-lift" style={{ animationDelay: `${index * 0.1}s` }}>
                <stat.icon style={{
                  fontSize: '3rem',
                  color: 'var(--primary-teal)',
                  marginBottom: '1rem'
                }} />
                <div className="stat-counter">{stat.number}</div>
                <p style={{ color: 'var(--gray-600)', fontWeight: 600 }}>{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section> */}



      {/* Revolutionary Gallery Section - 100x Better! */}
      <section style={{
        padding: '8rem 2rem',
        background: 'var(--gradient-hero)',
        position: 'relative',
        overflow: 'hidden'
      }}>
                 {/* Dog-themed Animated Background Elements */}
         <div style={{
           position: 'absolute',
           top: '5%',
           left: '3%',
           fontSize: '6rem',
           opacity: 0.03,
           color: 'var(--primary-teal)',
           transform: 'rotate(-20deg)',
           animation: 'float 8s ease-in-out infinite',
           userSelect: 'none',
           pointerEvents: 'none'
         }}>🐕‍🦺</div>
         <div style={{
           position: 'absolute',
           top: '15%',
           right: '5%',
           fontSize: '4rem',
           opacity: 0.04,
           color: 'var(--primary-blue)',
           transform: 'rotate(30deg)',
           animation: 'float 6s ease-in-out infinite reverse',
           userSelect: 'none',
           pointerEvents: 'none'
         }}>🦴</div>
         <div style={{
           position: 'absolute',
           bottom: '20%',
           left: '8%',
           fontSize: '5rem',
           opacity: 0.035,
           color: 'var(--primary-teal)',
           transform: 'rotate(45deg)',
           animation: 'float 10s ease-in-out infinite',
           userSelect: 'none',
           pointerEvents: 'none'
         }}>🐾</div>
         <div style={{
           position: 'absolute',
           bottom: '5%',
           right: '10%',
           fontSize: '3.5rem',
           opacity: 0.05,
           color: 'var(--primary-blue)',
           transform: 'rotate(-45deg)',
           animation: 'float 7s ease-in-out infinite reverse',
           userSelect: 'none',
           pointerEvents: 'none'
         }}>🎾</div>
         <div style={{
           position: 'absolute',
           top: '40%',
           left: '2%',
           fontSize: '2.5rem',
           opacity: 0.04,
           color: '#ff6b6b',
           transform: 'rotate(15deg)',
           animation: 'float 9s ease-in-out infinite',
           userSelect: 'none',
           pointerEvents: 'none'
         }}>❤️</div>
         <div style={{
           position: 'absolute',
           top: '60%',
           right: '3%',
           fontSize: '4.5rem',
           opacity: 0.03,
           color: 'var(--primary-teal)',
           transform: 'rotate(-60deg)',
           animation: 'float 11s ease-in-out infinite reverse',
           userSelect: 'none',
           pointerEvents: 'none'
         }}>🏠</div>
         <div style={{
           position: 'absolute',
           top: '25%',
           left: '50%',
           fontSize: '3rem',
           opacity: 0.025,
           color: 'var(--primary-blue)',
           transform: 'rotate(90deg)',
           animation: 'float 12s ease-in-out infinite',
           userSelect: 'none',
           pointerEvents: 'none'
         }}>🥇</div>

        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          {/* Enhanced Header with Statistics */}
          <div className="animate-fade-in-up" style={{ 
            textAlign: 'center', 
            marginBottom: '5rem',
            position: 'relative'
          }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.75rem',
              background: 'rgba(0, 191, 174, 0.1)',
              padding: '0.75rem 1.5rem',
              borderRadius: 'var(--radius-full)',
              marginBottom: '2rem',
              border: '1px solid rgba(0, 191, 174, 0.2)',
              backdropFilter: 'blur(10px)'
            }}>
              <FaImages style={{ color: 'var(--primary-teal)', fontSize: '1.2rem' }} />
              <span style={{ 
                color: 'var(--primary-teal)', 
                fontWeight: 700,
                fontSize: '1rem'
              }}>
                {t('home.gallery.badge')}
              </span>
            </div>

            <h2 style={{
              fontSize: 'clamp(3rem, 6vw, 5rem)',
              background: 'var(--gradient-primary)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              marginBottom: '1.5rem',
              fontWeight: 900,
              lineHeight: 1.2,
              textShadow: '0 8px 32px rgba(0, 191, 174, 0.3)'
            }}>
              {t('home.gallery.title')}<br />
              <span style={{ 
                fontSize: 'clamp(2.5rem, 5vw, 4rem)',
                background: 'linear-gradient(135deg, #ff6b6b 0%, #4ecdff 50%, #00bfae 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}>
                {t('home.gallery.subtitle')}
              </span>
            </h2>
            
            <p style={{
              fontSize: 'clamp(1.1rem, 2.5vw, 1.4rem)',
              color: 'var(--gray-600)',
              maxWidth: '700px',
              margin: '0 auto 3rem auto',
              lineHeight: 1.6,
              fontWeight: 500
            }}>
              {t('home.gallery.description')}
            </p>

            {/* Gallery Stats */}
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '3rem',
              flexWrap: 'wrap',
              marginBottom: '3rem'
            }}>
              {[
                { icon: FaImages, count: '500+', label: t('home.gallery.stats.photos') },
                { icon: FaVideo, count: '150+', label: t('home.gallery.stats.videos') },
                { icon: FaCamera, count: '50+', label: t('home.gallery.stats.photographers') }
              ].map((stat, index) => (
                <div key={index} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '1rem 1.5rem',
                  background: 'var(--gradient-card)',
                  borderRadius: 'var(--radius-xl)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  backdropFilter: 'blur(20px)',
                  boxShadow: 'var(--shadow-lg)'
                }}>
                  <div style={{
                    background: 'var(--gradient-primary)',
                    padding: '0.75rem',
                    borderRadius: 'var(--radius-lg)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <stat.icon style={{ color: 'white', fontSize: '1.2rem' }} />
                  </div>
                  <div>
                    <div style={{
                      fontSize: '1.5rem',
                      fontWeight: 800,
                      color: 'var(--gray-900)'
                    }}>
                      {stat.count}
                    </div>
                    <div style={{
                      fontSize: '0.9rem',
                      color: 'var(--gray-600)',
                      fontWeight: 600
                    }}>
                      {stat.label}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Call to Action */}
            <button
              onClick={() => navigate('/stories')}
              style={{
                background: 'var(--gradient-primary)',
                color: 'white',
                border: 'none',
                borderRadius: 'var(--radius-xl)',
                padding: '1rem 2.5rem',
                fontSize: '1.1rem',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'var(--transition-smooth)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.75rem',
                boxShadow: '0 8px 32px rgba(0, 191, 174, 0.4)',
                transform: 'translateY(0)',
                marginBottom: '3rem'
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 12px 40px rgba(0, 191, 174, 0.6)';
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 8px 32px rgba(0, 191, 174, 0.4)';
              }}
            >
              <FaExpand />
              {t('home.gallery.exploreButton')}
              <FaArrowRight />
            </button>
          </div>

          {/* Stunning Gallery Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
            gap: '2rem',
            gridAutoRows: 'minmax(300px, auto)'
          }}>
            {loadingFeatured ? (
              // Loading skeleton
              Array.from({ length: 6 }, (_, index) => (
                <div key={index} style={{
                  borderRadius: 'var(--radius-3xl)',
                  overflow: 'hidden',
                  background: 'var(--gradient-card)',
                  minHeight: index === 0 || index === 3 ? '400px' : '300px',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  boxShadow: 'var(--shadow-xl)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  animation: `fadeInUp 0.8s ease-out ${index * 0.1}s both`
                }}>
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '1rem',
                    color: 'var(--gray-500)'
                  }}>
                    <FaImages style={{ fontSize: '2rem', opacity: 0.5 }} />
                    <span style={{ fontSize: '0.9rem' }}>Loading...</span>
                  </div>
                </div>
              ))
            ) : (
              featuredMedia.map((media, index) => {
                const videoState = getVideoState(media.id);
                
                // Get or create video ref for this media
                if (!videoRefs.current[media.id]) {
                  videoRefs.current[media.id] = React.createRef();
                }
                const videoRef = videoRefs.current[media.id];

                const handleMouseEnter = (e) => {
                  if (!isMobile) {
                    e.currentTarget.style.transform = 'translateY(-8px) scale(1.02)';
                    e.currentTarget.style.boxShadow = '0 20px 60px rgba(0, 0, 0, 0.3)';
                    
                    // Handle video hover
                    if (media.type === 'video') {
                      handleVideoMouseEnter(media.id, videoRef);
                    }
                  }
                };

                const handleMouseLeave = (e) => {
                  if (!isMobile) {
                    e.currentTarget.style.transform = 'translateY(0) scale(1)';
                    e.currentTarget.style.boxShadow = 'var(--shadow-xl)';
                    
                    // Handle video leave
                    if (media.type === 'video') {
                      handleVideoMouseLeave(media.id, videoRef);
                    }
                  }
                };

                const handleTouchStart = (e) => {
                  if (isMobile && media.type === 'video') {
                    handleVideoTouchStart(media.id, videoRef, e);
                  }
                };

                const handleTouchEnd = (e) => {
                  if (isMobile && media.type === 'video') {
                    handleVideoTouchEnd(media.id, e);
                  }
                };

                return (
              <div
                key={media.id}
                className="gallery-card"
                style={{
                  borderRadius: 'var(--radius-3xl)',
                  overflow: 'hidden',
                  position: 'relative',
                    background: media.type === 'video' && !videoState.isPlaying ? 
                      `url(${media.thumb}) center/cover` : 
                      media.type === 'image' ? 
                        `url(${media.thumb}) center/cover` : 'transparent',
                  minHeight: index === 0 || index === 3 ? '400px' : '300px',
                  cursor: 'pointer',
                  gridRow: index === 0 || index === 3 ? 'span 2' : 'span 1',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  boxShadow: 'var(--shadow-xl)',
                  transform: 'translateY(0)',
                  transition: 'var(--transition-smooth)',
                  animation: `fadeInUp 0.8s ease-out ${index * 0.1}s both`
                }}
                  onClick={(e) => {
                    // On mobile, if it's a video, don't navigate - let touch handle it
                    if (isMobile && media.type === 'video') {
                      e.preventDefault();
                      return;
                    }
                    // Redirect to gallery page instead of opening modal
                    navigate('/gallery');
                  }}
                  onMouseEnter={handleMouseEnter}
                  onMouseLeave={handleMouseLeave}
                  onTouchStart={handleTouchStart}
                  onTouchEnd={handleTouchEnd}
                >
                  {/* Video Element for Videos */}
                  {media.type === 'video' && (
                    <video
                      ref={videoRef}
                      src={media.src}
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        zIndex: 1,
                        opacity: videoState.isPlaying ? 1 : 0,
                        transition: 'opacity 0.3s ease'
                      }}
                      muted
                      loop
                      playsInline
                      preload="metadata"
                      onPlay={() => handleVideoPlay(media.id)}
                      onPause={() => handleVideoPause(media.id)}
                      onLoadStart={() => handleVideoLoadStart(media.id)}
                      onCanPlay={() => handleVideoCanPlay(media.id)}
                      onError={() => handleVideoError(media.id)}
                    />
                  )}

                {/* Media Type Badge */}
                <div style={{
                  position: 'absolute',
                  top: '1.5rem',
                  left: '1.5rem',
                  background: media.type === 'video' ? 
                    'linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%)' : 
                    'linear-gradient(135deg, #00bfae 0%, #0097a7 100%)',
                  color: 'white',
                  padding: '0.5rem 1rem',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  backdropFilter: 'blur(10px)',
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
                  zIndex: 3
                }}>
                  {media.type === 'video' ? <FaVideo /> : <FaCamera />}
                  {media.type === 'video' ? media.duration : 'PHOTO'}
                </div>

                {/* Category Tag */}
                <div style={{
                  position: 'absolute',
                  top: '1.5rem',
                  right: '1.5rem',
                  background: 'rgba(0, 0, 0, 0.7)',
                  color: 'white',
                  padding: '0.4rem 0.8rem',
                  borderRadius: 'var(--radius-lg)',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  backdropFilter: 'blur(10px)',
                  zIndex: 3
                }}>
                  {media.category}
                </div>

                {/* Video Hover Indicator */}
                {media.type === 'video' && !videoState.isPlaying && !videoState.isLoading && (
                  <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    background: 'rgba(0, 0, 0, 0.6)',
                    color: 'white',
                    padding: '1rem 1.5rem',
                    borderRadius: 'var(--radius-full)',
                    fontSize: '0.9rem',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    backdropFilter: 'blur(10px)',
                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
                    zIndex: 4,
                    opacity: videoState.isHovered ? 0 : 1,
                    transition: 'opacity 0.3s ease',
                    pointerEvents: 'none'
                  }}>
                    <FaPlay style={{ fontSize: '0.8rem' }} />
                    {isMobile ? 'Tap to play' : 'Hover to play'}
                  </div>
                )}

                {/* Video Loading Indicator */}
                {media.type === 'video' && videoState.isLoading && (
                  <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    background: 'rgba(0, 0, 0, 0.7)',
                    color: 'white',
                    padding: '1rem 1.5rem',
                    borderRadius: 'var(--radius-full)',
                    fontSize: '0.9rem',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    backdropFilter: 'blur(10px)',
                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
                    zIndex: 4,
                    pointerEvents: 'none'
                  }}>
                    <div style={{
                      width: '16px',
                      height: '16px',
                      border: '2px solid rgba(255,255,255,0.3)',
                      borderTop: '2px solid white',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite'
                    }} />
                    Loading...
                  </div>
                )}

                {/* Gradient Overlay */}
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'linear-gradient(135deg, rgba(0,0,0,0.2) 0%, rgba(0,191,174,0.4) 100%)',
                  opacity: 0,
                  transition: 'var(--transition-smooth)',
                  zIndex: 1
                }} className="gradient-overlay" />

                {/* Hover Actions */}
                <div style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  display: 'flex',
                  gap: '1rem',
                  opacity: 0,
                  transition: 'var(--transition-smooth)',
                  zIndex: 4
                }} className="hover-actions">
                  <div style={{
                    background: 'rgba(255, 255, 255, 0.9)',
                    color: 'var(--primary-teal)',
                    padding: '1rem',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backdropFilter: 'blur(10px)',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
                    transform: 'scale(0.8)',
                    transition: 'var(--transition-smooth)'
                  }}>
                    <FaEye style={{ fontSize: '1.5rem' }} />
                  </div>
                  <div style={{
                    background: 'rgba(255, 255, 255, 0.9)',
                    color: 'var(--primary-teal)',
                    padding: '1rem',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backdropFilter: 'blur(10px)',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
                    transform: 'scale(0.8)',
                    transition: 'var(--transition-smooth)'
                  }}>
                    <FaExpand style={{ fontSize: '1.3rem' }} />
                  </div>
                </div>

                {/* Content Overlay */}
                <div style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  padding: '2rem',
                  background: 'linear-gradient(transparent, rgba(0,0,0,0.9))',
                  color: 'white',
                  transform: 'translateY(20px)',
                  transition: 'var(--transition-smooth)',
                  zIndex: 2
                }} className="content-overlay">
                  <h4 style={{
                    fontSize: '1.4rem',
                    fontWeight: 800,
                    marginBottom: '0.75rem',
                    color: 'white'
                  }}>
                    {media.title}
                  </h4>
                  
                  <p style={{
                    fontSize: '0.95rem',
                    opacity: 0.5,
                    marginBottom: '1rem',
                    lineHeight: 1.4,
                    color: 'white'
                  }}>
                    {media.description}
                  </p>

                  {/* Simplified Metadata - Only photographer */}
                  {media.photographer && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                      gap: '0.5rem',
                    fontSize: '0.85rem',
                      opacity: 0.8,
                      marginTop: '0.5rem'
                    }}>
                      <FaCamera style={{ fontSize: '0.8rem' }} />
                      <span>by {media.photographer}</span>
                    </div>
                  )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Enhanced Call to Action Footer */}
          <div style={{
            textAlign: 'center',
            marginTop: '5rem',
            padding: '3rem',
            background: 'var(--gradient-card)',
            borderRadius: 'var(--radius-3xl)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            backdropFilter: 'blur(20px)',
            boxShadow: 'var(--shadow-2xl)'
          }}>
            <h3 style={{
              fontSize: 'clamp(1.8rem, 4vw, 2.5rem)',
              fontWeight: 800,
              background: 'var(--gradient-primary)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              marginBottom: '1rem'
            }}>
              {t('home.gallery.cta.title')}
            </h3>
            <p style={{
              fontSize: '1.1rem',
              color: 'var(--gray-600)',
              marginBottom: '2rem',
              maxWidth: '600px',
              margin: '0 auto 2rem auto'
            }}>
              {t('home.gallery.cta.description')}
            </p>
            <button
              onClick={() => navigate('/stories')}
              style={{
                background: 'var(--gradient-primary)',
                color: 'white',
                border: 'none',
                borderRadius: 'var(--radius-2xl)',
                padding: '1.25rem 3rem',
                fontSize: '1.2rem',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'var(--transition-smooth)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '1rem',
                boxShadow: '0 12px 40px rgba(0, 191, 174, 0.4)',
                transform: 'translateY(0)'
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'translateY(-3px) scale(1.05)';
                e.target.style.boxShadow = '0 20px 60px rgba(0, 191, 174, 0.6)';
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0) scale(1)';
                e.target.style.boxShadow = '0 12px 40px rgba(0, 191, 174, 0.4)';
              }}
            >
              <FaImages style={{ fontSize: '1.3rem' }} />
              {t('home.gallery.cta.button')}
              <FaBone style={{ fontSize: '1.1rem' }} />
            </button>
          </div>
        </div>

        {/* Enhanced Hover Styles */}
        <style>{`
          .gallery-card:hover .gradient-overlay {
            opacity: 1;
          }
          .gallery-card:hover .content-overlay {
            transform: translateY(0);
          }
          .gallery-card:hover .hover-actions {
            opacity: 1;
          }
          .gallery-card:hover .hover-actions > div {
            transform: scale(1);
          }
          @keyframes float {
            0%, 100% { transform: translateY(0px) rotate(0deg); }
            50% { transform: translateY(-20px) rotate(180deg); }
          }
        `}</style>
      </section>




    </div>
  );
};

export default HomePage; 
