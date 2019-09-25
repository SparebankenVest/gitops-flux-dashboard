import React, {useState} from 'react';

const WorkloadFilter = ({workloads, onFilter}) => {
  const [filter, setFilter] = useState("");

  const handleChange = (e) => {
    if(!onFilter) return;

    setFilter(e.target.value); 

    if(filter === "") {
      if(onFilter) {
        return onFilter("", null);
      }
    }

    return onFilter(filter);
  };

  const clearFilter = () => {
    setFilter("");
    if(onFilter) onFilter("");
  }

  let clearButton = filter ? <i className="fa fa-times-circle" onClick={clearFilter}></i> : null;
  return (
    <span className="deleteicon">
      <input name="filterBox" value={filter} type="text" placeholder="Start typing to filter workloads" className="filter-input-text" onChange={handleChange}/>
      {clearButton}
    </span>
  );
};

export default WorkloadFilter;