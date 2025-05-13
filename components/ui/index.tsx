import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { Link } from 'expo-router';

// First, let's add the AppLink components
interface AppLinkProps {
  href: string;
  label?: string;
  labelStyle?: any;
  children?: React.ReactNode;
  touchableProps?: React.ComponentProps<typeof TouchableOpacity>;
  textProps?: React.ComponentProps<typeof Text>;
}

export const AppLink: React.FC<AppLinkProps> = ({
  href,
  label,
  labelStyle,
  children,
  touchableProps,
  textProps,
}) => {
  // TypeScript fix: Use the object pattern with type assertion
  const linkHref = { pathname: href as any };

  // If children are provided, use them, otherwise use the TouchableOpacity with label
  const linkContent = children ? (
    children
  ) : (
    <TouchableOpacity {...touchableProps}>
      <Text style={labelStyle} {...textProps}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <Link href={linkHref} asChild>
      {linkContent}
    </Link>
  );
};

interface TextLinkProps {
  href: string;
  label: string;
  style?: any;
  textProps?: React.ComponentProps<typeof Text>;
  touchableProps?: React.ComponentProps<typeof TouchableOpacity>;
}

export const TextLink: React.FC<TextLinkProps> = ({
  href,
  label,
  style,
  textProps,
  touchableProps,
}) => {
  return (
    <AppLink href={href} touchableProps={touchableProps}>
      <TouchableOpacity {...touchableProps}>
        <Text className='text-primary font-medium' style={style} {...textProps}>
          {label}
        </Text>
      </TouchableOpacity>
    </AppLink>
  );
};

// Now the existing components
interface CardProps {
  title: string;
  children: React.ReactNode;
  className?: string;
}

export const Card: React.FC<CardProps> = ({
  title,
  children,
  className = '',
}) => {
  return (
    <View className={`card p-4 mb-4 ${className}`}>
      {title && (
        <Text className='text-lg font-semibold mb-2 text-gray-800 dark:text-white'>
          {title}
        </Text>
      )}
      {children}
    </View>
  );
};

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'success' | 'error' | 'outline';
  icon?: React.ComponentProps<typeof FontAwesome>['name'];
  disabled?: boolean;
  className?: string;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  icon,
  disabled = false,
  className = '',
}) => {
  let buttonClass = '';

  switch (variant) {
    case 'primary':
      buttonClass = 'btn-primary';
      break;
    case 'secondary':
      buttonClass = 'btn-secondary';
      break;
    case 'success':
      buttonClass = 'btn-success';
      break;
    case 'error':
      buttonClass = 'btn-error';
      break;
    case 'outline':
      buttonClass = 'border border-primary text-primary bg-transparent';
      break;
    default:
      buttonClass = 'btn-primary';
  }

  return (
    <TouchableOpacity
      className={`btn ${buttonClass} flex-row items-center justify-center ${
        disabled ? 'opacity-50' : ''
      } ${className}`}
      onPress={onPress}
      disabled={disabled}
    >
      {icon && (
        <FontAwesome
          name={icon}
          size={16}
          color='white'
          style={{ marginRight: 8 }}
        />
      )}
      <Text
        className={
          variant === 'outline'
            ? 'text-primary font-medium'
            : 'text-white font-medium'
        }
      >
        {title}
      </Text>
    </TouchableOpacity>
  );
};

interface StatCardProps {
  icon: React.ComponentProps<typeof FontAwesome>['name'];
  title: string;
  value: string;
  color?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  icon,
  title,
  value,
  color = 'var(--color-primary)',
}) => {
  return (
    <View className='card p-3 w-[31%]'>
      <FontAwesome name={icon} size={20} color={color} />
      <Text className='mt-2 text-xs text-gray-500 dark:text-gray-400'>
        {title}
      </Text>
      <Text className='text-base font-semibold text-gray-800 dark:text-white'>
        {value}
      </Text>
    </View>
  );
};

interface EmptyStateProps {
  icon: React.ComponentProps<typeof FontAwesome>['name'];
  title: string;
  message: string;
  actionButton?: {
    title: string;
    onPress: () => void;
  };
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  message,
  actionButton,
}) => {
  return (
    <View className='card p-6 items-center justify-center'>
      <FontAwesome
        name={icon}
        size={40}
        color='var(--color-text-muted-light)'
      />
      <Text className='mt-4 text-lg font-semibold text-gray-800 dark:text-white text-center'>
        {title}
      </Text>
      <Text className='mt-2 text-center text-gray-600 dark:text-gray-400'>
        {message}
      </Text>

      {actionButton && (
        <TouchableOpacity
          className='btn btn-primary mt-4'
          onPress={actionButton.onPress}
        >
          <Text className='text-white font-medium'>{actionButton.title}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

// Badge component for statuses, tags, etc.
interface BadgeProps {
  text: string;
  variant?: 'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'info';
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({
  text,
  variant = 'primary',
  size = 'md',
}) => {
  let bgColor = '';
  let textColor = 'text-white';

  switch (variant) {
    case 'primary':
      bgColor = 'bg-primary';
      break;
    case 'secondary':
      bgColor = 'bg-secondary';
      break;
    case 'success':
      bgColor = 'bg-success';
      break;
    case 'error':
      bgColor = 'bg-error';
      break;
    case 'warning':
      bgColor = 'bg-warning';
      textColor = 'text-gray-800'; // Dark text for light background
      break;
    case 'info':
      bgColor = 'bg-info';
      break;
    default:
      bgColor = 'bg-primary';
  }

  const sizeClass = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm';

  return (
    <View className={`rounded-full ${bgColor} ${sizeClass}`}>
      <Text className={`${textColor} font-semibold`}>{text}</Text>
    </View>
  );
};

// Avatar component
interface AvatarProps {
  name: string;
  size?: 'sm' | 'md' | 'lg';
  bgColor?: string;
}

export const Avatar: React.FC<AvatarProps> = ({
  name,
  size = 'md',
  bgColor = 'var(--color-primary)',
}) => {
  let sizeClass = 'w-10 h-10';
  let fontSize = 'text-base';

  switch (size) {
    case 'sm':
      sizeClass = 'w-8 h-8';
      fontSize = 'text-sm';
      break;
    case 'md':
      sizeClass = 'w-12 h-12';
      fontSize = 'text-lg';
      break;
    case 'lg':
      sizeClass = 'w-16 h-16';
      fontSize = 'text-2xl';
      break;
  }

  // Get first letter of the name
  const initial = name ? name.charAt(0).toUpperCase() : '?';

  return (
    <View
      className={`rounded-full items-center justify-center ${sizeClass}`}
      style={{ backgroundColor: bgColor }}
    >
      <Text className={`${fontSize} font-bold text-white`}>{initial}</Text>
    </View>
  );
};
