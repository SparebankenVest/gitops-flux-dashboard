import React from 'react';

const ContainerName = ({name}) => {
  return (
    <td style={{verticalAlign: "middle"}} className="image-name" >
      <h1>{name}</h1>
    </td>
  );
};

export default ContainerName;