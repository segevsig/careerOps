import { useNavigate } from 'react-router-dom';
import ResumeScoring from '../components/ResumeScoring';

const ResumeScoringPage = () => {
  const navigate = useNavigate();
  return (
    <ResumeScoring
      variant="page"
      onClose={() => navigate('/dashboard')}
    />
  );
};

export default ResumeScoringPage;
