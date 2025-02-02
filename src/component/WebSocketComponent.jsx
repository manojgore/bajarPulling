import axios from 'axios';
import React, { useState, useEffect, useRef } from 'react';
import { apiProvider } from '../constants/constants';
import { useNavigate, useParams } from 'react-router-dom';
import "../App.css";

const WebSocketComponent = () => {
    const [ws, setWs] = useState(null);
    const [array, setArray] = useState(['CommodityGird']);
    const [statusUpdates, setStatusUpdates] = useState([]);
		const [formData, setFormData] = useState({})
		const [selectedCommodities, setSelectedCommodities] = useState([])
		const [marketTypesDetails,setMarketTypesDetails] = useState([]);
		const [isLoading, setIsLoading] = useState(true)
		const [selectedOptions, setSelectedOptions] = useState({})
    const logContainerRef = useRef(null)
    const { secretKey } = useParams();
    const nagivate = useNavigate();
    const [failed, setFailed] = useState([]);
    const [insert, setInsert] = useState([]);
    const [update, setUpdate] = useState([]);

    useEffect(() => {
        // if (secretKey !== "550e8400-e29b-41d4-a716-446655440000") {
        //   nagivate("/");
        // }

        const socket = new WebSocket('ws://localhost:8080');
        setWs(socket);

				fetchSectionsData();
        // Handle incoming messages
        socket.onmessage = (event) => {
            const data = JSON.parse(event.data);
            setStatusUpdates((prev) => [...prev, `${data.message}`]);
            switch (data.status) {
              case "error":
                setFailed((prev)=>([...prev,data.data]))
                break;
              case "insert":
                setInsert((prev)=>([...prev,data.data]))
                break;
              case "update":
                setUpdate((prev)=>([...prev,data.data]))
                break;
              default:
                break;
            }
        };

        // Clean up WebSocket connection
        return () => socket.close();
    }, []);

    useEffect(() => {
      if (logContainerRef.current) {
        logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight
      }
    }, [logContainerRef]) //Corrected dependency

		const fetchSectionsData = async () => {
			try {
				const response = await axios.get(`${apiProvider}/get-sections`);
				const data = response.data;
				if (response.status === 200) {
					setMarketTypesDetails(data);
				}
				const initialSelectedOptions = Object.keys(data).reduce((acc, key) => {
          acc[key] = {
            ...data[key],
            DropdownOptions: data[key].DropdownOptions.map((option) => ({ ...option, selected: false })),
          }
          return acc
        }, {})
        setSelectedOptions(initialSelectedOptions)
				setIsLoading(false)

			} catch (error) {
				window.alert("something went wrong with fetching constants");
				setIsLoading(false)
			}
		}

		const handleCheckboxChange = (section, code) => {
			setSelectedOptions((prev) => ({
				...prev,
				[section]: {
					...prev[section],
					DropdownOptions: prev[section].DropdownOptions.map((option) =>
						option.code === code ? { ...option, selected: !option.selected } : option,
					),
				},
			}))
		}
	
		const handleSelectAll = (section) => {
			setSelectedOptions((prev) => ({
				...prev,
				[section]: {
					...prev[section],
					DropdownOptions: prev[section].DropdownOptions.map((option) => ({
						...option,
						selected: !prev[section].DropdownOptions.every((opt) => opt.selected),
					})),
				},
			}))
		}

    // const handleSubmit = () => {
		// 		console.log(selectedOptions);

    //     if (ws && ws.readyState === WebSocket.OPEN) {
    //         // Send the array to the server
    //         ws.send(JSON.stringify({ secretKeys:"processArray" , payload: {marketTypes : array} }));
    //     }
    // };

		const handleSubmit = (e) => {
			e.preventDefault();
      setStatusUpdates([]);
			let dataToSend = Object.keys(selectedOptions).reduce((acc, key) => {
				acc[key] = {
					...selectedOptions[key],
					DropdownOptions: selectedOptions[key].DropdownOptions.filter((option) => option.selected),
				}
				return acc;
			}, {});
			if (ws && ws.readyState === WebSocket.OPEN) {
				ws.send(JSON.stringify({ secretKeys:"processArray" , payload: {marketTypes : Object.keys(dataToSend) , marketTypesDetails : dataToSend} }));
			}
			console.log("Data to send to backend:", dataToSend)
			// Here you would typically send the data to a server
		}

    if (isLoading) {
    return (
      <div className="container mt-5 text-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-2">Loading market types...</p>
      </div>
    )
  }

  if (!marketTypesDetails) {
    return (
      <div className="container mt-5 text-center">
        <p className="text-danger">Failed to load market types. Please try again later.</p>
      </div>
    )
  }

 

  return (
    <div className="container mt-5">
      <h1 className="mb-4">Pulling data Service</h1>
      <form onSubmit={handleSubmit}>
        {Object.entries(selectedOptions).map(([key, section]) => (
          <div key={key} className="card mb-4">
            <div className="card-header">
              <h5 className="mb-0">{section.name}</h5>
            </div>
            <div className="card-body">
              <div className="form-check mb-3">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id={`select-all-${key}`}
                  checked={section.DropdownOptions.every((option) => option.selected)}
                  onChange={() => handleSelectAll(key)}
                />
                <label className="form-check-label" htmlFor={`select-all-${key}`}>
                  Select All
                </label>
              </div>
              <div className="row">
                {section.DropdownOptions.map((option) => (
                  <div key={option.code} className="col-md-4 mb-2">
                    <div className="form-check">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id={`${key}-${option.code}`}
                        checked={option.selected}
                        onChange={() => handleCheckboxChange(key, option.code)}
                      />
                      <label className="form-check-label" htmlFor={`${key}-${option.code}`}>
                        {option.name}
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
        <button type="submit" className="btn btn-primary w-100">
          Submit
        </button>
      </form>

      <div className="container mt-5">
        <h1 className="mb-4">Script Logs</h1>
        <div className="card">
          <div className="card-body" style={{ height: "100px", overflowY: "auto" }} ref={logContainerRef}>
            {statusUpdates.length === 0 ? (
              <p className="text-muted">Waiting for logs...</p>
            ) : (
              <pre className="mb-0">
                <code>{statusUpdates.join("\n")}</code>
              </pre>
            )}
          </div>
        </div>
      </div>
      <div className="container mt-5">
        <h3 className="mb-4">Inserted data</h3>
          {insert.map((data)=>(<div  className='text-12 lh-16 fw-500 uppercase bg-dark-1 text-white tag inserted' style={{width: 'fit-content'}}> Section : {data.Section} Name : {data.Name} Code : {data.Code}</div>))}
      </div>
      <div className="container mt-5">
        <h3 className="mb-4">Updated data</h3>
          {update.map((data)=>(<div  className='text-12 lh-16 fw-500 uppercase bg-dark-1 text-white tag udpated' style={{width: 'fit-content'}}> Section : {data.Section} Name : {data.Name} Code : {data.Code}</div>))}
      </div>
      <div className="container mt-5">
        <h3 className="mb-4">Error data</h3>
          {failed.map((data)=>(<div  className='text-12 lh-16 fw-500 uppercase bg-dark-1 text-white tag error' style={{width: 'fit-content'}}> Section : {data.Section} Name : {data.Name} Code : {data.Code}</div>))}
      </div>
    </div>
  )
};

export default WebSocketComponent;
