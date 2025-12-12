import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import AIChatScreen from '../src/screens/AIChatScreen';

jest.mock('react-native-linear-gradient', () => 'LinearGradient');

const mockGoBack = jest.fn();
const mockNavigation = {
  goBack: mockGoBack,
};

describe('AIChatScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders correctly with initial message', () => {
    const { getByText, getByPlaceholderText } = render(
      <AIChatScreen navigation={mockNavigation} />
    );

    expect(getByText('AI Learning Assistant')).toBeTruthy();
    expect(getByText('Always ready to help')).toBeTruthy();
    expect(getByText('Hello! I\'m your AI learning assistant. How can I help you learn something new today?')).toBeTruthy();
    expect(getByPlaceholderText('Ask me anything...')).toBeTruthy();
  });

  it('sends message and receives AI response', async () => {
    const { getByPlaceholderText, getByText } = render(
      <AIChatScreen navigation={mockNavigation} />
    );

    const textInput = getByPlaceholderText('Ask me anything...');
    const sendButton = getByText('Send');

    fireEvent.changeText(textInput, 'What is React Native?');
    fireEvent.press(sendButton);

    expect(getByText('What is React Native?')).toBeTruthy();
    expect(getByText('AI is thinking...')).toBeTruthy();

    jest.advanceTimersByTime(2000);

    await waitFor(() => {
      expect(getByText('That\'s a great question! Let me help you understand that concept step by step.')).toBeTruthy();
    });
  });

  it('clears input after sending message', () => {
    const { getByPlaceholderText, getByText } = render(
      <AIChatScreen navigation={mockNavigation} />
    );

    const textInput = getByPlaceholderText('Ask me anything...');
    const sendButton = getByText('Send');

    fireEvent.changeText(textInput, 'Test message');
    fireEvent.press(sendButton);

    expect(textInput.props.value).toBe('');
  });

  it('does not send empty messages', () => {
    const { getByPlaceholderText, getByText, queryByText } = render(
      <AIChatScreen navigation={mockNavigation} />
    );

    const textInput = getByPlaceholderText('Ask me anything...');
    const sendButton = getByText('Send');

    fireEvent.changeText(textInput, '   ');
    fireEvent.press(sendButton);

    expect(queryByText('   ')).toBeFalsy();
  });

  it('navigates back when back button is pressed', () => {
    const { getByText } = render(
      <AIChatScreen navigation={mockNavigation} />
    );

    const backButton = getByText('←');
    fireEvent.press(backButton);

    expect(mockGoBack).toHaveBeenCalled();
  });

  it('displays timestamps for messages', () => {
    const { getByText } = render(
      <AIChatScreen navigation={mockNavigation} />
    );

    const currentTime = new Date().toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
    
    expect(getByText(currentTime)).toBeTruthy();
  });

  it('disables send button when input is empty', () => {
    const { getByPlaceholderText, getByText } = render(
      <AIChatScreen navigation={mockNavigation} />
    );

    const sendButton = getByText('Send');
    expect(sendButton.props.accessibilityState?.disabled).toBeTruthy();

    const textInput = getByPlaceholderText('Ask me anything...');
    fireEvent.changeText(textInput, 'Test');
    
    expect(sendButton.props.accessibilityState?.disabled).toBeFalsy();
  });

  it('enables send button when input has text', () => {
    const { getByPlaceholderText, getByText } = render(
      <AIChatScreen navigation={mockNavigation} />
    );

    const textInput = getByPlaceholderText('Ask me anything...');
    const sendButton = getByText('Send');

    fireEvent.changeText(textInput, 'Hello AI!');
    
    expect(sendButton.props.accessibilityState?.disabled).toBeFalsy();
  });
});