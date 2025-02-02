import React, { useEffect, useState } from "react";
import parse from "html-react-parser";
import axios from "axios";
import { apiProvider } from "../constants/constants";
import { useParams } from "react-router-dom";
import { timeAgo } from "../Utils";

const Table = () => {
  const [htmlContent, setHtmlContent] = useState(null);
	const { marketType , code } = useParams();
	const [error, setError] = useState("");

	const fetchTableData = async () => {
		try {
			const response = await axios.get(`${apiProvider}/api/getTable/${marketType}/${code}`);
			if ((response).status === 200) {
				
				const data = JSON.parse(response.data.table_data);

				const parser = new DOMParser();
				const doc = parser.parseFromString(data, 'text/html');

				// Access the div with class name 'title2' and append new text
				const title2Div = doc.querySelector('.title2');
				title2Div.textContent = `Last update ${timeAgo(response.data.last_update)} ` + title2Div.textContent;
				setHtmlContent(doc.body.innerHTML);
			} else {
				setError("Something went wrong");
			}
		} catch (err) {
			setError("Something went wrong");
		}
	}

  useEffect(() => {
		fetchTableData();
  }, []);
  return <div>
		<div dangerouslySetInnerHTML={{ __html: htmlContent }}></div>
		{error ? error : ""}
		</div>;
};

export default Table;
