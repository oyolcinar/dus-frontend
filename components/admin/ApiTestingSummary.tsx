// import React, { useState } from 'react';
// import {
//   View,
//   Text,
//   TouchableOpacity,
//   FlatList,
//   StyleSheet,
//   ActivityIndicator,
//   Alert,
//   ScrollView,
// } from 'react-native';
// import { batchTestEndpoints } from '../../src/api/apiTestProxy';
// import API_ENDPOINTS from '../../src/config/apiEndpoints';
// import * as FileSystem from 'expo-file-system';

// export default function ApiTestingSummary() {
//   const [results, setResults] = useState<any>(null);
//   const [loading, setLoading] = useState<boolean>(false);
//   const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

//   const runTests = async (category?: string) => {
//     setLoading(true);

//     try {
//       const endpoints = category
//         ? API_ENDPOINTS[category]
//         : Object.values(API_ENDPOINTS).flat();

//       const testResults = await batchTestEndpoints(endpoints);
//       setResults(testResults);
//     } catch (error) {
//       console.error('Test error:', error);
//       Alert.alert('Testing Error', error.message);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const exportResults = async () => {
//     if (!results) {
//       Alert.alert('No Results', 'Run tests first before exporting');
//       return;
//     }

//     try {
//       const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
//       const fileName = `api-test-${timestamp}.json`;

//       // Check if FileSystem is available (Expo environment)
//       if (FileSystem) {
//         const fileUri = `${FileSystem.documentDirectory}${fileName}`;
//         await FileSystem.writeAsStringAsync(
//           fileUri,
//           JSON.stringify(results, null, 2)
//         );

//         Alert.alert(
//           'Export Successful',
//           `Results saved to ${fileUri}`,
//           [
//             {
//               text: 'OK',
//               style: 'default'
//             },
//             {
//               text: 'Share',
//               onPress: () => {
//                 // You'd need to implement file sharing here
//                 // using expo-sharing or react-native-share
//                 Alert.alert('Sharing not implemented in this example');
//               }
//             }
//           ]
//         );
//       } else {
//         // Fallback for non-Expo environments
//         Alert.alert(
//           'Export Feature',
//           'File export requires Expo FileSystem. As an alternative, you can copy the JSON results to clipboard.'
//         );
//       }
//     } catch (error) {
//       console.error('Export error:', error);
//       Alert.alert('Export Failed', error.message);
//     }
//   };

//   return (
//     <View style={styles.container}>
//       <Text style={styles.title}>API Testing Summary</Text>

//       {/* Category selection */}
//       <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesContainer}>
//         {Object.keys(API_ENDPOINTS).map(category => (
//           <TouchableOpacity
//             key={category}
//             style={[
//               styles.categoryButton,
//               selectedCategory === category && styles.selectedCategory
//             ]}
//             onPress={() => {
//               setSelectedCategory(category);
//               runTests(category);
//             }}
//           >
//             <Text style={styles.categoryText}>{category}</Text>
//           </TouchableOpacity>
//         ))}
//         <TouchableOpacity
//           style={[
//             styles.categoryButton,
//             !selectedCategory && styles.selectedCategory
//           ]}
//           onPress={() => {
//             setSelectedCategory(null);
//             runTests();
//           }}
//         >
//           <Text style={styles.categoryText}>All Endpoints</Text>
//         </TouchableOpacity>
//       </ScrollView>

//       {/* Actions */}
//       <View style={styles.actionsContainer}>
//         <TouchableOpacity
//           style={[styles.actionButton, styles.primaryButton]}
//           onPress={() => runTests(selectedCategory || undefined)}
//           disabled={loading}
//         >
//           <Text style={styles.actionButtonText}>
//             {loading ? 'Testing...' : 'Run Tests'}
//           </Text>
//         </TouchableOpacity>

//         <TouchableOpacity
//           style={[styles.actionButton, styles.secondaryButton]}
//           onPress={exportResults}
//           disabled={!results || loading}
//         >
//           <Text style={styles.actionButtonText}>Export Results</Text>
//         </TouchableOpacity>
//       </View>

//       {/* Loading indicator */}
//       {loading && (
//         <View style={styles.loadingContainer}>
//           <ActivityIndicator size="large" color="#4b6bfb" />
//           <Text style={styles.loadingText}>Testing endpoints...</Text>
//         </View>
//       )}

//       {/* Results */}
//       {results && !loading && (
//         <View style={styles.resultsContainer}>
//           <View style={styles.summaryContainer}>
//             <Text style={styles.summaryText}>
//               Summary: {results.successful}/{results.total} successful
//             </Text>
//             <View style={styles.statsContainer}>
//               <View style={styles.statItem}>
//                 <Text style={styles.statLabel}>Success:</Text>
//                 <Text style={[styles.statValue, styles.successText]}>
//                   {results.successful}
//                 </Text>
//               </View>
//               <View style={styles.statItem}>
//                 <Text style={styles.statLabel}>Failed:</Text>
//                 <Text style={[styles.statValue, styles.errorText]}>
//                   {results.failed}
//                 </Text>
//               </View>
//               <View style={styles.statItem}>
//                 <Text style={styles.statLabel}>Success Rate:</Text>
//                 <Text style={styles.statValue}>
//                   {Math.round((results.successful / results.total) * 100)}%
//                 </Text>
//               </View>
//             </View>
//           </View>

//           <FlatList
//             data={results.results}
//             keyExtractor={(item) => `${item.method}-${item.path}`}
//             renderItem={({ item }) => (
//               <View style={styles.resultItem}>
//                 <View style={styles.resultHeader}>
//                   <View
//                     style={[
//                       styles.methodBadge,
//                       item.method === 'GET' && styles.getBadge,
//                       item.method === 'POST' && styles.postBadge,
//                       item.method === 'PUT' && styles.putBadge,
//                       item.method === 'DELETE' && styles.deleteBadge,
//                     ]}
//                   >
//                     <Text style={styles.methodText}>{item.method}</Text>
//                   </View>
//                   <Text style={styles.endpointText}>{item.path}</Text>
//                 </View>

//                 <View style={styles.resultDetails}>
//                   <View style={styles.resultDetail}>
//                     <Text style={styles.detailLabel}>Status:</Text>
//                     <Text
//                       style={[
//                         styles.detailValue,
//                         item.success ? styles.successText : styles.errorText
//                       ]}
//                     >
//                       {item.status} {item.success ? 'OK' : 'Failed'}
//                     </Text>
//                   </View>

//                   {item.success ? (
//                     <View style={styles.resultDetail}>
//                       <Text style={styles.detailLabel}>Duration:</Text>
//                       <Text style={styles.detailValue}>{item.duration}ms</Text>
//                     </View>
//                   ) : (
//                     <View style={styles.resultDetail}>
//                       <Text style={styles.detailLabel}>Error:</Text>
//                       <Text style={[styles.detailValue, styles.errorText]}>
//                         {item.error}
//                       </Text>
//                     </View>
//                   )}

//                   {item.dataKeys && (
//                     <View style={styles.resultDetail}>
//                       <Text style={styles.detailLabel}>Response Keys:</Text>
//                       <Text style={styles.detailValue}>
//                         {item.dataKeys.join(', ')}
//                       </Text>
//                     </View>
//                   )}
//                 </View>
//               </View>
//             )}
//           />
//         </View>
//       )}
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     padding: 16,
//     backgroundColor: '#f8f9fa',
//   },
//   title: {
//     fontSize: 20,
//     fontWeight: 'bold',
//     marginBottom: 16,
//     color: '#333',
//   },
//   categoriesContainer: {
//     flexDirection: 'row',
//     marginBottom: 16,
//     maxHeight: 50,
//   },
//   categoryButton: {
//     paddingHorizontal: 16,
//     paddingVertical: 8,
//     borderRadius: 20,
//     marginRight: 8,
//     backgroundColor: '#e9ecef',
//   },
//   selectedCategory: {
//     backgroundColor: '#4b6bfb',
//   },
//   categoryText: {
//     fontWeight: '500',
//     color: '#333',
//   },
//   actionsContainer: {
//     flexDirection: 'row',
//     marginBottom: 16,
//   },
//   actionButton: {
//     flex: 1,
//     paddingVertical: 12,
//     borderRadius: 8,
//     alignItems: 'center',
//     marginHorizontal: 4,
//   },
//   primaryButton: {
//     backgroundColor: '#4b6bfb',
//   },
//   secondaryButton: {
//     backgroundColor: '#6c757d',
//   },
//   actionButtonText: {
//     color: 'white',
//     fontWeight: '600',
//   },
//   loadingContainer: {
//     padding: 20,
//     alignItems: 'center',
//   },
//   loadingText: {
//     marginTop: 8,
//     color: '#666',
//   },
//   resultsContainer: {
//     flex: 1,
//   },
//   summaryContainer: {
//     backgroundColor: 'white',
//     padding: 16,
//     borderRadius: 8,
//     marginBottom: 16,
//     elevation: 2,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 1 },
//     shadowOpacity: 0.1,
//     shadowRadius: 2,
//   },
//   summaryText: {
//     fontSize: 16,
//     fontWeight: 'bold',
//     marginBottom: 8,
//   },
//   statsContainer: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//   },
//   statItem: {
//     alignItems: 'center',
//   },
//   statLabel: {
//     fontSize: 12,
//     color: '#666',
//   },
//   statValue: {
//     fontSize: 18,
//     fontWeight: 'bold',
//   },
//   successText: {
//     color: '#28a745',
//   },
//   errorText: {
//     color: '#dc3545',
//   },
//   resultItem: {
//     backgroundColor: 'white',
//     padding: 12,
//     borderRadius: 8,
//     marginBottom: 8,
//     elevation: 1,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 1 },
//     shadowOpacity: 0.1,
//     shadowRadius: 1,
//   },
//   resultHeader: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginBottom: 8,
//   },
//   methodBadge: {
//     paddingHorizontal: 8,
//     paddingVertical: 4,
//     borderRadius: 4,
//     marginRight: 8,
//   },
//   getBadge: {
//     backgroundColor: '#28a745',
//   },
//   postBadge: {
//     backgroundColor: '#007bff',
//   },
//   putBadge: {
//     backgroundColor: '#fd7e14',
//   },
//   deleteBadge: {
//     backgroundColor: '#dc3545',
//   },
//   methodText: {
//     color: 'white',
//     fontWeight: 'bold',
//     fontSize: 12,
//   },
//   endpointText: {
//     flex: 1,
//     fontSize: 14,
//     fontWeight: '500',
//   },
//   resultDetails: {
//     borderTopWidth: 1,
//     borderTopColor: '#eee',
//     paddingTop: 8,
//   },
//   resultDetail: {
//     flexDirection: 'row',
//     marginVertical: 2,
//   },
//   detailLabel: {
//     width: 100,
//     fontSize: 12,
//     color: '#666',
//   },
//   detailValue: {
//     flex: 1,
//     fontSize: 12,
//   },
// });
