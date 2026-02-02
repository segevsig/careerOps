import { useNavigate } from 'react-router-dom';
import CoverLetterGenerator from '../components/CoverLetterGenerator';

const CoverLetterPage = () => {
  const navigate = useNavigate();
  return (
    <CoverLetterGenerator
      variant="page"
      onClose={() => navigate('/dashboard')}
    />
  );
};

export default CoverLetterPage;
