import React, { useState } from "react";
import axios from "axios";

const RegressionModule = () => {

    const [file, setFile] = useState(null);
    const [columns, setColumns] = useState([]);

    const [dependentVar, setDependentVar] = useState("");
    const [independentVars, setIndependentVars] = useState([]);

    const [results, setResults] = useState(null);

    const handleFileChange = async (e) => {

        const uploadedFile = e.target.files[0];

        setFile(uploadedFile);

        const formData = new FormData();
        formData.append("file", uploadedFile);

        const response = await axios.post(
            "http://localhost:8000/get-columns",
            formData
        );

        setColumns(response.data.columns);
    };

    const handleIndependentChange = (col) => {

        if (independentVars.includes(col)) {
            setIndependentVars(
                independentVars.filter((v) => v !== col)
            );
        } else {
            setIndependentVars([...independentVars, col]);
        }
    };

    const runRegression = async () => {

        const formData = new FormData();

        formData.append("file", file);
        formData.append("dependent_var", dependentVar);

        formData.append(
            "independent_vars",
            JSON.stringify(independentVars)
        );

        const response = await axios.post(
            "http://localhost:8000/regression",
            formData
        );

        setResults(response.data);
    };

    return (
        <div className="module-container">

            <h2>Regression Analysis</h2>

            <input
                type="file"
                onChange={handleFileChange}
            />

            {
                columns.length > 0 && (
                    <div>

                        <div className="selection-section">

                            <h4>Dependent Variable</h4>

                            <select
                                value={dependentVar}
                                onChange={(e) =>
                                    setDependentVar(e.target.value)
                                }
                            >
                                <option value="">
                                    Select Variable
                                </option>

                                {
                                    columns.map((col) => (
                                        <option
                                            key={col}
                                            value={col}
                                        >
                                            {col}
                                        </option>
                                    ))
                                }

                            </select>
                        </div>

                        <div className="selection-section">

                            <h4>Independent Variables</h4>

                            {
                                columns.map((col) => (
                                    <div key={col}>

                                        <input
                                            type="checkbox"
                                            checked={
                                                independentVars.includes(col)
                                            }
                                            onChange={() =>
                                                handleIndependentChange(col)
                                            }
                                        />

                                        <label>{col}</label>

                                    </div>
                                ))
                            }

                        </div>

                        <button onClick={runRegression}>
                            Run Regression
                        </button>

                    </div>
                )
            }

            {
                results && (
                    <div className="results-section">

                        <h3>Model Summary</h3>

                        <p>
                            <strong>R²:</strong>
                            {" "}
                            {results.r_squared}
                        </p>

                        <p>
                            <strong>Adjusted R²:</strong>
                            {" "}
                            {results.adjusted_r_squared}
                        </p>

                        <p>
                            <strong>F-statistic:</strong>
                            {" "}
                            {results.f_statistic}
                        </p>

                        <p>
                            <strong>RMSE:</strong>
                            {" "}
                            {results.rmse}
                        </p>

                        <h3>Regression Equation</h3>

                        <p>{results.equation}</p>

                        <h3>Coefficient Table</h3>

                        <table>

                            <thead>
                                <tr>
                                    <th>Variable</th>
                                    <th>Coefficient</th>
                                    <th>Std Error</th>
                                    <th>t value</th>
                                    <th>p value</th>
                                </tr>
                            </thead>

                            <tbody>

                                {
                                    results.coefficients.map((row, index) => (
                                        <tr key={index}>
                                            <td>{row.Variable}</td>
                                            <td>{row.Coefficient}</td>
                                            <td>{row.Std_Error}</td>
                                            <td>{row.t_value}</td>
                                            <td>{row.p_value}</td>
                                        </tr>
                                    ))
                                }

                            </tbody>

                        </table>

                    </div>
                )
            }

        </div>
    );
};

export default RegressionModule;