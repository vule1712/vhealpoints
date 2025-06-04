import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: {
    padding: 40,
    backgroundColor: '#fff',
    fontFamily: 'Helvetica',
    fontSize: 12,
    lineHeight: 1.5
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4
  },
  clinicBlock: {
    flexDirection: 'column',
    fontSize: 12
  },
  clinicName: {
    fontWeight: 'bold',
    fontSize: 13,
    marginBottom: 2
  },
  clinicAddress: {
    fontSize: 12
  },
  dateBlock: {
    fontSize: 12,
    alignItems: 'flex-end',
    marginTop: 2
  },
  separator: {
    borderBottomWidth: 1,
    borderBottomColor: '#222',
    marginVertical: 8
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 12,
    letterSpacing: 1
  },
  infoBlock: {
    marginBottom: 8
  },
  label: {
    fontWeight: 'bold',
    marginRight: 4
  },
  row: {
    flexDirection: 'row',
    marginBottom: 2
  },
  sectionHeader: {
    fontWeight: 'bold',
    marginTop: 8,
    marginBottom: 2
  },
  noteBox: {
    minHeight: 30,
    border: '1 solid #bbb',
    borderRadius: 2,
    padding: 6,
    marginBottom: 8
  },
  signatureRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 40
  },
  signatureBlock: {
    alignItems: 'center',
    flex: 1
  },
  signatureLabel: {
    fontSize: 11,
    marginBottom: 80
  },
  signatureName: {
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 2
  }
});

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth()+1).toString().padStart(2, '0')}/${d.getFullYear()}`;
};

const AppointmentPDF = ({ appointment }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      {/* Top Row: Clinic info and Date */}
      <View style={styles.topRow}>
        <View style={styles.clinicBlock}>
          <Text style={styles.clinicName}>{appointment.doctorId?.clinicName || 'Clinic Name'}</Text>
          <Text style={styles.clinicAddress}>Clinic address: {appointment.doctorId?.clinicAddress || '-'}</Text>
        </View>
        <View style={styles.dateBlock}>
          <Text>Date: {formatDate(appointment.slotId?.date) || formatDate(new Date())}</Text>
        </View>
      </View>
      <View style={styles.separator} />
      {/* Title */}
      <Text style={styles.title}>Appointment & Treatment report</Text>
      {/* Doctor Info */}
      <View style={styles.infoBlock}>
        <View style={styles.row}>
          <Text style={styles.label}>Doctor:</Text>
          <Text>{appointment.doctorId?.name ? `Dr. ${appointment.doctorId?.name}` : '-'}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Specialization:</Text>
          <Text>{appointment.doctorId?.specialization || '-'}</Text>
        </View>
      </View>
      {/* Patient Info */}
      <View style={styles.infoBlock}>
        <View style={styles.row}>
          <Text style={styles.label}>Patient:</Text>
          <Text>{appointment.patientId?.name || '-'}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Blood type:</Text>
          <Text>{appointment.patientId?.bloodType || '-'}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Email:</Text>
          <Text>{appointment.patientId?.email || '-'}</Text>
        </View>
      </View>
      {/* Appointment Details */}
      <View style={styles.infoBlock}>
        <Text style={styles.sectionHeader}>Appointment Details:</Text>
        <Text>Time: {appointment.slotId?.startTime} - {appointment.slotId?.endTime}</Text>
      </View>
      {/* Patient's Note */}
      <View style={styles.infoBlock}>
        <Text style={styles.sectionHeader}>Patient's note:</Text>
        <View style={styles.noteBox}>
          <Text>{appointment.notes || ''}</Text>
        </View>
      </View>
      {/* Doctor's Note */}
      <View style={styles.infoBlock}>
        <Text style={styles.sectionHeader}>Doctor's note:</Text>
        <View style={styles.noteBox}>
          <Text>{appointment.doctorComment || ''}</Text>
        </View>
      </View>
      {/* Signatures */}
      <View style={styles.signatureRow}>
        <View style={styles.signatureBlock}>
          <Text style={styles.signatureLabel}>Patient</Text>
          <Text style={styles.signatureName}>{appointment.patientId?.name || ''}</Text>
        </View>
        <View style={styles.signatureBlock}>
          <Text style={styles.signatureLabel}>Doctor</Text>
          <Text style={styles.signatureName}>{appointment.doctorId?.name ? `Dr. ${appointment.doctorId?.name}` : ''}</Text>
        </View>
      </View>
    </Page>
  </Document>
);

export default AppointmentPDF; 