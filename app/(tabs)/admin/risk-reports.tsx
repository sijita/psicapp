import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StyleSheet,
} from 'react-native';
import { Stack } from 'expo-router';
import {
  getRiskReports,
  updateRiskReport,
  RiskReport,
} from '@/lib/suicideDetection';
import { getCurrentUser, supabase } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';

type ReportWithProfile = RiskReport & {
  profile: {
    username: string;
    full_name: string;
    avatar_url: string;
  };
};

export default function RiskReportsScreen() {
  const [reports, setReports] = useState<ReportWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    checkUserRole();
    loadReports();
  }, []);

  const checkUserRole = async () => {
    try {
      const { user } = await getCurrentUser();
      if (!user) {
        Alert.alert('Error', 'Debes iniciar sesión para acceder a esta página');
        return;
      }

      // Verificar si el usuario es administrador
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error al verificar rol de usuario:', error);
        return;
      }

      if (profile?.role !== 'admin') {
        setIsAdmin(false);
        Alert.alert(
          'Acceso denegado',
          'No tienes permisos para acceder a esta página'
        );
      } else {
        setIsAdmin(true);
      }
    } catch (error) {
      console.error('Error al verificar rol de usuario:', error);
    }
  };

  const loadReports = async () => {
    setLoading(true);
    try {
      const { success, data, error } = await getRiskReports();

      if (success && data) {
        setReports(data as ReportWithProfile[]);
      } else {
        console.error('Error al cargar reportes:', error);
        Alert.alert('Error', 'No se pudieron cargar los reportes');
      }
    } catch (error) {
      console.error('Error inesperado al cargar reportes:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadReports();
  };

  const markAsReviewed = async (reportId: string) => {
    try {
      const { success } = await updateRiskReport(reportId, true);

      if (success) {
        // Actualizar la lista de reportes localmente
        setReports((prevReports) =>
          prevReports.map((report) =>
            report.id === reportId ? { ...report, reviewed: true } : report
          )
        );
        Alert.alert('Éxito', 'Reporte marcado como revisado');
      } else {
        Alert.alert('Error', 'No se pudo actualizar el reporte');
      }
    } catch (error) {
      console.error('Error al marcar reporte como revisado:', error);
    }
  };

  const updateSeverity = async (
    reportId: string,
    severity: 'low' | 'medium' | 'high'
  ) => {
    try {
      const { success } = await updateRiskReport(
        reportId,
        true,
        undefined,
        severity
      );

      if (success) {
        // Actualizar la lista de reportes localmente
        setReports((prevReports) =>
          prevReports.map((report) =>
            report.id === reportId
              ? { ...report, severity_level: severity }
              : report
          )
        );
        Alert.alert('Éxito', `Nivel de severidad actualizado a ${severity}`);
      } else {
        Alert.alert('Error', 'No se pudo actualizar el nivel de severidad');
      }
    } catch (error) {
      console.error('Error al actualizar nivel de severidad:', error);
    }
  };

  const renderSeverityButtons = (report: ReportWithProfile) => (
    <View className="flex-row justify-between mt-2">
      <TouchableOpacity
        className={`px-3 py-1 rounded-full ${
          report.severity_level === 'low' ? 'bg-green-500' : 'bg-gray-200'
        }`}
        onPress={() => updateSeverity(report.id!, 'low')}
      >
        <Text
          className={`${
            report.severity_level === 'low' ? 'text-white' : 'text-gray-700'
          }`}
        >
          Bajo
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        className={`px-3 py-1 rounded-full ${
          report.severity_level === 'medium' ? 'bg-yellow-500' : 'bg-gray-200'
        }`}
        onPress={() => updateSeverity(report.id!, 'medium')}
      >
        <Text
          className={`${
            report.severity_level === 'medium' ? 'text-white' : 'text-gray-700'
          }`}
        >
          Medio
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        className={`px-3 py-1 rounded-full ${
          report.severity_level === 'high' ? 'bg-red-500' : 'bg-gray-200'
        }`}
        onPress={() => updateSeverity(report.id!, 'high')}
      >
        <Text
          className={`${
            report.severity_level === 'high' ? 'text-white' : 'text-gray-700'
          }`}
        >
          Alto
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderReportItem = ({ item }: { item: ReportWithProfile }) => {
    console.log('Rendering report item:', item); // Agrega este console.log para depurar
    return (
      <View className="bg-white p-4 rounded-lg mb-4 shadow-sm">
        <View className="flex-row justify-between items-center mb-2">
          <Text className="font-bold text-lg">
            {item.profile?.full_name || 'Usuario desconocido'}
          </Text>
          <Text className="text-gray-500 text-xs">
            {new Date(item.timestamp).toLocaleString('es-ES')}
          </Text>
        </View>

        <Text className="text-gray-800 mb-2">{item.message_content}</Text>

        <View className="bg-red-50 p-2 rounded mb-2">
          <Text className="text-red-700 font-medium">Palabras detectadas:</Text>
          <Text className="text-red-600">
            {item.detected_keywords.join(', ')}
          </Text>
        </View>

        {renderSeverityButtons(item)}

        {!item.reviewed && (
          <TouchableOpacity
            className="bg-blue-500 py-2 px-4 rounded-lg mt-3 items-center"
            onPress={() => markAsReviewed(item.id!)}
          >
            <Text className="text-white font-medium">Marcar como revisado</Text>
          </TouchableOpacity>
        )}

        {item.reviewed && (
          <View className="flex-row items-center mt-3">
            <Ionicons name="checkmark-circle" size={18} color="#10B981" />
            <Text className="text-green-600 ml-1">Revisado</Text>
          </View>
        )}
      </View>
    );
  };

  if (!isAdmin) {
    return (
      <View className="flex-1 justify-center items-center p-4">
        <Text className="text-lg text-center mb-4">
          No tienes permisos para acceder a esta página
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      <Stack.Screen
        options={{
          title: 'Reportes de Riesgo',
          headerShown: true,
        }}
      />

      {loading && !refreshing ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text className="mt-2 text-gray-600">Cargando reportes...</Text>
        </View>
      ) : reports.length === 0 ? (
        <View className="flex-1 justify-center items-center p-4">
          <Ionicons name="document-text-outline" size={48} color="#9CA3AF" />
          <Text className="text-lg text-center mt-4 text-gray-500">
            No hay reportes de riesgo disponibles
          </Text>
        </View>
      ) : (
        <FlatList
          data={reports}
          renderItem={renderReportItem}
          keyExtractor={(item) => item.id!}
          contentContainerStyle={{ padding: 16 }}
          refreshing={refreshing}
          onRefresh={handleRefresh}
        />
      )}
    </View>
  );
}
