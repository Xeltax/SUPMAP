import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastMessage {
  message: string;
  type: ToastType;
  duration?: number;
}

interface ToastContextType {
  show: (toast: ToastMessage) => void;
  hide: () => void;
}

const ToastContext = createContext<ToastContextType>({
  show: () => {},
  hide: () => {}
});

export const useToast = () => useContext<ToastContextType>(ToastContext);

export const ToastProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState('');
  const [type, setType] = useState<ToastType>('info');
  const [duration, setDuration] = useState(3000);
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const timer = useRef<number | null>(null);
  
  const show = (toast: ToastMessage) => {
    if (timer.current) {
      clearTimeout(timer.current);
    }
    
    setMessage(toast.message);
    setType(toast.type);
    setDuration(toast.duration || 3000);
    setVisible(true);
    
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true
    }).start();
    
    timer.current = setTimeout(() => {
      hide();
    }, toast.duration || 3000) as unknown as number;
  };
  
  const hide = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true
    }).start(() => {
      setVisible(false);
    });
  };
  
  useEffect(() => {
    return () => {
      if (timer.current) {
        clearTimeout(timer.current);
      }
    };
  }, []);
  
  const getBgColor = () => {
    switch (type) {
      case 'success':
        return '#4CAF50';
      case 'error':
        return '#F44336';
      case 'warning':
        return '#FF9800';
      case 'info':
      default:
        return '#2196F3';
    }
  };
  
  return (
    <ToastContext.Provider value={{ show, hide }}>
      {children}
      {visible && (
        <Animated.View 
          style={[
            styles.container, 
            { 
              opacity: fadeAnim,
              backgroundColor: getBgColor() 
            }
          ]}
        >
          <Text style={styles.text}>{message}</Text>
        </Animated.View>
      )}
    </ToastContext.Provider>
  );
};

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 50,
    left: width * 0.1,
    right: width * 0.1,
    backgroundColor: '#333',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 25,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    alignItems: 'center',
    justifyContent: 'center'
  },
  text: {
    color: 'white',
    fontWeight: 'bold'
  }
});
