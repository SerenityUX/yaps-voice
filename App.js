import { Text, ScrollView, TouchableOpacity, View, StyleSheet, SafeAreaView } from 'react-native';
import React, { useState, useEffect } from 'react';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import { FontAwesome } from '@expo/vector-icons';

export default function App() {



  function getTodaysQuestion() {

    // Replace 'YYYY-MM-DD' with your specific date
    const pastDate = new Date('2023-11-23');
    const currentDate = new Date();

    // Calculate the difference in milliseconds
    const diffInMilliseconds = currentDate - pastDate;

    // Convert milliseconds to days
    const diffInDays = diffInMilliseconds / (1000 * 60 * 60 * 24);


    const thoughtProvokingQuestions = [
      "What’s something that you experienced when you were young that now shapes the way you are today?",
      "How has a failure, or apparent failure, set you up for later success?",
      "What are the most influential experiences you’ve had in your life?",
      "How have your priorities changed over time and why?",
      "What small gesture from a stranger made a big impact on you?",
      "What risks are worth taking, and why?",
      "How has your perspective on the world changed over time?",
      "What life-altering things should every human ideally get to experience at least once?",
      "What’s the most important thing you’ve learned from your parents?",
      "What’s something you’ve changed your mind about as you’ve gotten older?",
      "What’s the most memorable lesson you learned from your grandparents?",
      "What’s the best decision you’ve ever made?",
      "What does it mean to live a good life?",
      "How has a book or movie changed your outlook on life?",
      "What’s a belief you hold with which many people disagree?",
      "What habit or improvement are you working on currently?",
      "In what ways have you grown in the past five years?",
      "What do you wish you spent more time doing five years ago?",
      "What’s something you were wrong about before?",
      "What’s something that feels both within and outside of your control?",
      "If you could send a message to your younger self, what would you say?",
      "What’s the most significant change you’ve made in your life recently?",
      "What are you most grateful for, right now, in this moment?",
      "What’s a harsh truth you’ve learned that made you stronger?",
      "What do you struggle with the most?",
      "What’s a personal victory you’ve had that others may not know about?",
      "How do you handle heartache or emotional pain?",
      "What’s the most courageous thing you’ve ever done?",
      "What’s the biggest misconception people have about you?",
      "How has your life been different than you imagined?",
      "What do you do to calm your mind?",
      "How has a stranger’s kindness affected you?",
      "What’s the most beautiful place you’ve ever been?",
      "What’s something you’re looking forward to in the future?",
      "What memory do you cherish the most?",
      "What’s a decision you made that changed the course of your life?",
      "How do you define success?",
      "What’s a lesson you learned the hard way?",
      "What’s something that excites you about the future?",
      "What’s the best advice you’ve ever been given?",
      "What’s a goal you’ve recently set for yourself?",
      "How do you express gratitude in your life?",
      "What’s an experience that has shaped your character?",
      "What’s a dream you’ve had that you’re still working towards?",
      "What’s the most valuable piece of wisdom you’ve gained so far in life?",
      "What’s a piece of advice you would give to your future self?",
      "How do you find peace in times of chaos?",
      "What’s a moment in your life you would relive if you could?",
      "What’s something that challenges you every day?",
      "How has your upbringing influenced the person you are today?"
  ];
  

    return(thoughtProvokingQuestions[Math.floor(diffInDays)])
  }



  const [recording, setRecording] = useState(null);
  const [recordingStatus, setRecordingStatus] = useState('idle');
  const [audioPermission, setAudioPermission] = useState(null);
  const [recordings, setRecordings] = useState([]);

  useEffect(() => {

    // Simply get recording permission upon first render
    async function getPermission() {
      await Audio.requestPermissionsAsync().then((permission) => {
        console.log('Permission Granted: ' + permission.granted);
        setAudioPermission(permission.granted)
      }).catch(error => {
        console.log(error);
      });
    }

    // Call function to get permission
    getPermission()
    // Cleanup upon first render
    return () => {
      if (recording) {
        stopRecording();
      }
    };
  }, []);

  async function startRecording() {
    try {
      // needed for IoS
      if (audioPermission) {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true
        })
      }

      const newRecording = new Audio.Recording();
      console.log('Starting Recording')
      await newRecording.prepareToRecordAsync(Audio.RECORDING_OPTIONS_PRESET_HIGH_QUALITY);
      await newRecording.startAsync();

      
      setRecording(newRecording);
      setRecordingStatus('recording');

    } catch (error) {
      console.error('Failed to start recording', error);
    }
  }

  async function playRecording(fileName) {
    console.log("this plays audio")
    const playbackObject = new Audio.Sound();
    console.log()
    await playbackObject.loadAsync({uri: `https://yaps.s3.amazonaws.com/${fileName}`});
    await playbackObject.playAsync();
  }


  async function updateAudios() {
    fetch('https://serenidadcdn.vercel.app/api/list')
  .then(response => {
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    return response.json();
  })
  .then(data => {
    console.log(data.data);
    const filteredData = data.data.filter((dataObject) => {
        // Parse the UTC timestamp
        const utcDate = new Date(dataObject.LastUpdated);

        // Use a library like moment-timezone to handle timezone conversion more reliably
        // Convert to EST (UTC-5) or EDT (UTC-4) depending on daylight saving
        // For simplicity, I'm using a fixed offset here
        const estOffset = -5; // Adjust this based on Daylight Saving Time if necessary
        const estDate = new Date(utcDate.setHours(utcDate.getHours() + estOffset));

        // Get the current date in EST
        const nowUtc = new Date();
        const nowEst = new Date(nowUtc.setHours(nowUtc.getHours() + estOffset));

        // Compare the dates (ignoring time part)
        return estDate.toDateString() != nowEst.toDateString();
    });

    // Map the filtered data directly
    setRecordings(filteredData.map((object) => object.Key));
})

  .catch(error => {
    console.error('There has been a problem with your fetch operation:', error);
  });
  }

  
async function stopRecording() {
  try {
    if (recordingStatus === 'recording') {
      console.log('Stopping Recording');
      await recording.stopAndUnloadAsync();
      const recordingUri = recording.getURI();
      console.log(recording);
      const fileName = `recording-${Date.now()}.mp3`;

      await FileSystem.makeDirectoryAsync(FileSystem.documentDirectory + 'recordings/', { intermediates: true });
      const filePath = FileSystem.documentDirectory + 'recordings/' + fileName;
      await FileSystem.moveAsync({
        from: recordingUri,
        to: filePath
      });

      const fileSystemInfo = await FileSystem.readDirectoryAsync(FileSystem.documentDirectory + 'recordings/');

      // setRecordings(fileSystemInfo);
      console.log(fileSystemInfo);
      setRecording(null);
      setRecordingStatus('stopped');

      // Uploading the file directly from URI
      const formData = new FormData();
      
      formData.append('files', {
        uri: filePath,
        name: fileName,
        type: 'audio/mpeg',
     });

      const uploadResponse = await fetch('https://cdn-audio-yeah.vercel.app/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!uploadResponse.ok) {
        throw new Error('Upload failed');
      }

      const jsonResponse = await uploadResponse.text();
      console.log('Upload successful:', jsonResponse);
      updateAudios()

    }
  } catch (error) {
    console.error('Failed to stop recording or upload file', error);
    // Enhanced error handling
    if (error.response) {
      console.error(error.response.data);
      console.error(error.response.status);
      console.error(error.response.headers);
    } else if (error.request) {
      console.error(error.request);
    } else {
      console.error('Error', error.message);
    }
  }
}

  
  
  

  async function handleRecordButtonPress() {
    if (recording) {
      const audioUri = await stopRecording(recording);
      if (audioUri) {
        console.log('Saved audio file to', savedUri);
      }
    } else {
      await startRecording();
    }
  }

  return (

    recordings.length == 0 ? (
    <SafeAreaView style={{width: "100%", height: "100%", flex: 1, alignItems: "center", display: "flex", justifyContent: "space-between"}}>
      <Text>Yaps</Text>
      <Text style={{fontSize: 32}}>{getTodaysQuestion()}</Text>
      <TouchableOpacity onPress={handleRecordButtonPress}>
        <Text style={{color: !recording ? '#007AFF' : '#FF3333'}}>{!recording ? 'Start Recording' : 'Stop Recording'}</Text>
      </TouchableOpacity>
      {/* <Text style={styles.recordingStatusText}>{`Recording status: ${recordingStatus}`}</Text> */}


    </SafeAreaView>) : (
      <SafeAreaView style={{width: "100%", height: "100%", flex: 1, alignItems: "center", display: "flex", justifyContent: "space-between"}}>
      <Text>Yaps</Text>
      <ScrollView>
        {recordings.map((recording) => <TouchableOpacity key={recording} onPress={() => playRecording(recording)}><Text>{recording}</Text></TouchableOpacity>)}
      </ScrollView>
    </SafeAreaView>
    )
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 128,
    height: 128,
    borderRadius: 64,
    backgroundColor: 'red',
  },
  recordingStatusText: {
    marginTop: 16,
  },
});


