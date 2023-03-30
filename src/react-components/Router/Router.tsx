export interface RouterProps {
  elems: JSX.Element[];
  selected: number;
}

export const Router: React.FC<RouterProps> = ({ elems, selected }) => {
  return elems[selected];
};