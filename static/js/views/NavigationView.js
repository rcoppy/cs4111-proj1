const NavigationView = (data) => {
    // data is map of form: 
    // { path: label }

    return `
    <ul>
        ${genMenu(data)}
    </ul>
`};

const genMenu = (data) => {
    return Array.from(data.entries()).map((pair) => NavItem(pair[0], pair[1])).join(''); 
};

const NavItem = (path, label) => `
    <a data-path="${path}">
        <li>${label}</li>
    </a>
`;

export default NavigationView; 